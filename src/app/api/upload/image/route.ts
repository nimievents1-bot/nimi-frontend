import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { getSessionUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

/**
 * Image upload endpoint for admin-managed assets (pastry photography,
 * future gift-collection imagery, etc.).
 *
 * Storage backend: Cloudflare R2 via its S3-compatible API.
 *   - Writes go through the AWS SDK pointed at the R2 endpoint.
 *   - Public reads are served from the bucket's r2.dev subdomain (or a
 *     custom domain like images.nimievents.com if connected in the
 *     Cloudflare dashboard). The S3 endpoint is never exposed to clients;
 *     the response only contains the public URL.
 *
 * Security model:
 *   - Auth: requires an admin session (OWNER / EDITOR). Customers can't
 *     upload images. SUPPORT is excluded because the role isn't expected
 *     to mutate the catalog.
 *   - Validation: MIME type whitelist + 15 MB upload cap (the
 *     pipeline re-encodes to a much smaller WebP before storing).
 *   - Filename: random uuid + a sanitised extension; the original name
 *     is discarded so user-supplied filenames can never be attacker bait
 *     (path traversal, polyglot tricks, XSS via Content-Disposition).
 *   - Content-Type is forced to the validated MIME; we never trust the
 *     extension alone, and never echo back unsanitised input.
 *   - Runtime: explicit Node.js runtime — the AWS SDK isn't reliably
 *     compatible with the Edge runtime, and image uploads aren't latency-
 *     sensitive enough to justify the workarounds.
 *
 * Setup: in Cloudflare R2 dashboard create a bucket, generate an API
 * token with read+write scoped to that bucket, enable public access
 * (r2.dev subdomain or custom domain), then set on this project:
 *   - R2_ACCOUNT_ID
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *   - R2_BUCKET
 *   - R2_PUBLIC_URL  (no trailing slash — e.g. https://pub-xxx.r2.dev)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

/**
 * Generous upload cap — we accept up to 15 MB from the client because
 * camera-roll photos and casual phone uploads commonly land in the
 * 4–10 MB range. The pipeline below re-encodes everything to a much
 * smaller WebP before it ever reaches R2, so the limit here is about
 * what the SERVER will spend memory on, not what we want to keep.
 */
const MAX_BYTES = 15 * 1024 * 1024;
const ADMIN_ROLES = new Set(["OWNER", "EDITOR"]);

/**
 * Target dimensions for the re-encoded image. 1600px on the long edge
 * is plenty for full-bleed hero use and any high-DPR card; anything
 * larger is bytes spent for no visible benefit on phone screens.
 * Image is fit "inside" the bounding box so the original aspect ratio
 * is preserved — we never crop a customer photo blindly.
 */
const TARGET_MAX_EDGE_PX = 1600;

/**
 * WebP quality used by the re-encode. 78 is a sweet spot — visually
 * indistinguishable from the source for food photography while
 * yielding ~70-80% size reductions over the original JPEG.
 */
const TARGET_WEBP_QUALITY = 78;

/**
 * Build an R2 client lazily so a misconfigured env doesn't crash the
 * whole app at import time. Returns null when any required credential
 * is missing — the caller surfaces a friendly 500 in that case.
 */
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
  // ---- Auth ----
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ---- Config ----
  const env = serverEnv();
  const client = r2Client(env);
  if (!client) {
    // eslint-disable-next-line no-console
    console.error(
      "[upload/image] R2 credentials missing — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL on the web project.",
    );
    return NextResponse.json(
      {
        error:
          "Image upload isn't configured on the server yet. Paste an image URL for now, or ask the site owner to finish R2 setup.",
      },
      { status: 500 },
    );
  }

  // ---- Parse & validate ----
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the upload payload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing `file` field." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported file type: ${file.type || "unknown"}. Use PNG, JPG, WebP or AVIF.`,
      },
      { status: 400 },
    );
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

  // ---- Re-encode through sharp ----
  // Pipeline goals (in order of priority):
  //   1. Cap the long edge at TARGET_MAX_EDGE_PX so we never store
  //      anything larger than what a phone screen could possibly use.
  //      `fit: "inside"` preserves the original aspect ratio — we
  //      don't crop the customer's photo.
  //   2. Strip EXIF, GPS, colour-profile, and other metadata so we
  //      don't leak the photographer's home coordinates into a public
  //      bucket. `withMetadata` is intentionally NOT called.
  //   3. Recompress as WebP at TARGET_WEBP_QUALITY. WebP is universally
  //      supported by every browser we ship to (Chrome, Safari, Edge,
  //      Firefox) and shrinks food photography by 70-80 % vs JPEG.
  //
  // Any sharp failure here is surfaced to the admin as a 400 — usually
  // a corrupt / truncated upload, not a server bug, and the operator
  // can retry without paging anyone.
  let optimisedBytes: Buffer;
  try {
    const sourceBytes = Buffer.from(await file.arrayBuffer());
    // `failOn: "none"` lets sharp tolerate slightly-malformed images
    // rather than refusing outright. We still get an error for
    // genuinely unreadable input.
    optimisedBytes = await sharp(sourceBytes, { failOn: "none" })
      .rotate() // honour EXIF orientation before stripping metadata
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
    console.error("[upload/image] sharp re-encode failed", err);
    return NextResponse.json(
      {
        error:
          "We couldn't read that image. Try saving it as PNG, JPG, or WebP and uploading again.",
      },
      { status: 400 },
    );
  }

  // ---- Filename ----
  // Always use .webp regardless of the input format — the pipeline
  // above re-encodes everything to WebP. The pastries/ prefix groups
  // pastry-catalog assets in R2 so they're easy to audit / lifecycle.
  const key = `pastries/${crypto.randomUUID()}.webp`;

  // ---- Upload ----
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET!,
        Key: key,
        Body: optimisedBytes,
        ContentType: "image/webp",
        // 1 year cache. Filenames are content-addressed by uuid so they
        // never collide; replacing an image creates a new key anyway.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    // R2_PUBLIC_URL had any trailing slashes stripped in env.ts.
    const url = `${env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      url,
      contentType: "image/webp",
      // Surfaced so the admin UI can show "shrunk 4.2 MB → 280 KB"
      // if it wants to celebrate the win. Optional.
      originalBytes: file.size,
      optimisedBytes: optimisedBytes.byteLength,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[upload/image] R2 PutObject failed", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Upload failed. Try again or paste an image URL instead.",
      },
      { status: 500 },
    );
  }
}
