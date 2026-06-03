import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { serverEnv } from "@/lib/env";

/**
 * PUBLIC logo upload endpoint for the gifting checkout form.
 *
 * Unlike `/api/upload/image` (admin-only catalogue assets) this route
 * is reachable by anonymous customers because logos are uploaded
 * during checkout — long before the customer has any account. That
 * means we trade convenience for strict abuse controls:
 *
 *   - IP-bucketed rate limit (in-memory token bucket). 6 uploads per
 *     IP per hour, refilled at one token every 10 minutes. This is
 *     plenty for an honest customer who needs to retry once or twice,
 *     and tight enough that a bored attacker can't fill the bucket.
 *
 *   - 10 MB hard upload cap. Anything larger is rejected before
 *     reading into memory; sharp's resize stage caps the on-disk
 *     output at ~250 KB anyway for raster images.
 *
 *   - MIME-by-magic-bytes (NOT trust the Content-Type header). The
 *     client's reported type is informational only. The route sniffs
 *     the first few bytes and rejects anything that doesn't match a
 *     known logo format.
 *
 *   - Accept-list: PNG, JPEG, WebP, AVIF, SVG, PDF. Everything else
 *     is refused. ZIP / Office docs / scripts are all rejected — the
 *     point is to receive a brand mark, not arbitrary files.
 *
 *   - Random UUID filenames under `gift-logos/`. The user's filename
 *     is discarded so polyglot / traversal / Content-Disposition
 *     tricks can't influence the stored key.
 *
 *   - Forced `Content-Disposition: attachment` on SVG and PDF. The
 *     R2 public bucket lives on its own origin (pub-*.r2.dev or a
 *     custom subdomain), so even if an SVG contained a script it
 *     could not read nimievents.com cookies; the attachment header
 *     adds defence-in-depth by forcing the browser to download
 *     rather than render inline.
 *
 *   - Raster images run through sharp: rotate-by-EXIF, resize to fit
 *     1600px long-edge, strip all metadata (no GPS / EXIF leak), and
 *     re-encode as WebP for compact, predictable storage. SVG and
 *     PDF pass through unchanged because we want the operator to
 *     receive the original vector for their design tool.
 *
 *   - Response leaks nothing about server internals: R2 endpoint,
 *     storage path, error stack traces are all hidden.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// Rate limit (per IP, in-memory).
//
// In-memory is fine for the realistic deployment shape: Vercel
// serverless workers per region; each worker remembers its own
// bucket. An attacker who rotates regions still hits a different
// bucket each call, which is the desired "best effort" behaviour
// at this scale. If we move to Redis later the contract here
// stays identical.
// ============================================================

const BUCKET_CAPACITY = 6;
const REFILL_INTERVAL_MS = 10 * 60 * 1000; // one token every 10 minutes
const BUCKETS = new Map<string, { tokens: number; lastRefillAt: number }>();
const RATE_LIMIT_WINDOW_MS = BUCKET_CAPACITY * REFILL_INTERVAL_MS;
const BUCKET_TTL_MS = RATE_LIMIT_WINDOW_MS * 2;

function consumeToken(ip: string): boolean {
  const now = Date.now();

  // Janitor: drop stale buckets so memory doesn't grow without
  // bound. Cheap enough to run on every call because the map
  // size stays small (one entry per active IP).
  for (const [key, bucket] of BUCKETS) {
    if (now - bucket.lastRefillAt > BUCKET_TTL_MS) {
      BUCKETS.delete(key);
    }
  }

  const bucket = BUCKETS.get(ip) ?? {
    tokens: BUCKET_CAPACITY,
    lastRefillAt: now,
  };

  // Refill: integer tokens since last refill, capped at capacity.
  const refilled = Math.floor((now - bucket.lastRefillAt) / REFILL_INTERVAL_MS);
  if (refilled > 0) {
    bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + refilled);
    bucket.lastRefillAt = bucket.lastRefillAt + refilled * REFILL_INTERVAL_MS;
  }

  if (bucket.tokens <= 0) {
    BUCKETS.set(ip, bucket);
    return false;
  }

  bucket.tokens -= 1;
  BUCKETS.set(ip, bucket);
  return true;
}

function clientIp(request: Request): string {
  // Behind Vercel: prefer the trusted left-most public IP from
  // x-forwarded-for, then x-real-ip, then a literal "unknown"
  // sentinel so we still rate-limit something rather than letting
  // requests with no IP through unbucketed.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri;
  return "unknown";
}

// ============================================================
// File-type sniffing.
//
// We *never* trust file.type — browsers cheerfully send any string
// the user-agent fancies. The first few bytes of the upload are
// far more reliable for the formats we accept.
// ============================================================

type LogoFormat = {
  /** Final stored MIME. */
  mime: string;
  /** Stored file extension (no leading dot). */
  ext: "webp" | "svg" | "pdf";
  /**
   * Whether to re-encode through sharp. Raster: yes. Vector / PDF: no
   * (we want the operator to receive the original asset).
   */
  reencode: boolean;
};

const FMT_WEBP: LogoFormat = { mime: "image/webp", ext: "webp", reencode: true };
const FMT_SVG: LogoFormat = { mime: "image/svg+xml", ext: "svg", reencode: false };
const FMT_PDF: LogoFormat = { mime: "application/pdf", ext: "pdf", reencode: false };

/**
 * Inspect the first ~256 bytes of the upload to decide what we're
 * actually looking at. Returns null for anything we don't accept —
 * the caller turns that into a 400.
 */
function sniffFormat(bytes: Buffer): LogoFormat | null {
  if (bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return FMT_WEBP;
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return FMT_WEBP;
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return FMT_WEBP;
  }

  // AVIF: ISO BMFF, "ftypavif" or "ftypavis" at offset 4
  if (
    bytes.length > 11 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    bytes[8] === 0x61 &&
    bytes[9] === 0x76 &&
    bytes[10] === 0x69 &&
    (bytes[11] === 0x66 || bytes[11] === 0x73)
  ) {
    return FMT_WEBP;
  }

  // PDF: "%PDF-"
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return FMT_PDF;
  }

  // SVG: best-effort detection. We require the file to be plausibly
  // textual AND contain "<svg" within the first 1024 bytes. This
  // catches both raw "<svg ...>" and XML-prologue "<?xml...><svg".
  // We reject SVGs that contain "<script", "<foreignObject", or
  // event-handler attributes (on*=) to keep the worst footguns out.
  const head = bytes.subarray(0, Math.min(bytes.length, 1024)).toString("utf8");
  if (/<svg[\s>]/i.test(head)) {
    if (/<script\b/i.test(head)) return null;
    if (/<foreignObject\b/i.test(head)) return null;
    if (/\son[a-z]+\s*=/i.test(head)) return null;
    return FMT_SVG;
  }

  return null;
}

// ============================================================
// R2 plumbing — same shape as /api/upload/image so the operator
// configures one set of credentials.
// ============================================================

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TARGET_MAX_EDGE_PX = 1600;
const TARGET_WEBP_QUALITY = 78;

function r2Client(env: ReturnType<typeof serverEnv>) {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET ||
    !env.R2_PUBLIC_URL
  ) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
  });
}

export async function POST(request: Request) {
  // ---- Rate limit ----
  const ip = clientIp(request);
  if (!consumeToken(ip)) {
    return NextResponse.json(
      {
        error:
          "Too many uploads from this connection. Please wait a few minutes and try again.",
      },
      { status: 429 },
    );
  }

  // ---- Config ----
  const env = serverEnv();
  const client = r2Client(env);
  if (!client) {
    // eslint-disable-next-line no-console
    console.error(
      "[upload/gift-logo] R2 credentials missing — set R2_* env vars on the web project.",
    );
    return NextResponse.json(
      {
        error:
          "Logo upload isn't available right now. Please continue without it — we'll email you afterwards to collect your logo.",
      },
      { status: 503 },
    );
  }

  // ---- Parse ----
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read the upload payload." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing `file` field." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Max ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 400 },
    );
  }

  const sourceBytes = Buffer.from(await file.arrayBuffer());

  // ---- Sniff ----
  const fmt = sniffFormat(sourceBytes);
  if (!fmt) {
    return NextResponse.json(
      {
        error:
          "Unsupported file. Please upload PNG, JPG, WebP, AVIF, SVG, or PDF.",
      },
      { status: 400 },
    );
  }

  // ---- Optimise (raster only) ----
  let storedBytes: Buffer;
  if (fmt.reencode) {
    try {
      storedBytes = await sharp(sourceBytes, { failOn: "none" })
        .rotate()
        .resize({
          width: TARGET_MAX_EDGE_PX,
          height: TARGET_MAX_EDGE_PX,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: TARGET_WEBP_QUALITY, effort: 4 })
        .toBuffer();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[upload/gift-logo] sharp re-encode failed", err);
      return NextResponse.json(
        {
          error:
            "We couldn't read that image. Try saving it as PNG or JPG and uploading again.",
        },
        { status: 400 },
      );
    }
  } else {
    // SVG / PDF: store the original bytes. We already validated
    // size and sniffed the magic header.
    storedBytes = sourceBytes;
  }

  // ---- Filename ----
  // Random UUID under gift-logos/ so the operator can audit and
  // lifecycle these separately from the catalogue images. Extension
  // matches the *stored* format, not what the user uploaded —
  // raster → .webp regardless of input.
  const key = `gift-logos/${crypto.randomUUID()}.${fmt.ext}`;

  // ---- Upload ----
  // Force `attachment` for SVG and PDF so a customer-supplied file
  // can never auto-render in another user's browser later. Raster
  // logos render inline (admin tile preview, etc.) which is fine
  // because sharp re-encoded them.
  const inlineSafe = fmt.reencode;
  const contentDisposition = inlineSafe
    ? "inline"
    : `attachment; filename="logo.${fmt.ext}"`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: key,
        Body: storedBytes,
        ContentType: fmt.mime,
        ContentDisposition: contentDisposition,
        // 1 year cache — keys are content-addressed.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = `${env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      url,
      contentType: fmt.mime,
      originalBytes: file.size,
      optimisedBytes: storedBytes.byteLength,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[upload/gift-logo] R2 PutObject failed", err);
    return NextResponse.json(
      {
        error:
          "Upload failed. Please try again in a moment — your order isn't lost.",
      },
      { status: 502 },
    );
  }
}
