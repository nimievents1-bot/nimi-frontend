import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

/**
 * Image upload endpoint for admin-managed assets (pastry photography,
 * future gift-collection imagery, etc.).
 *
 * Security model:
 *   - Auth: requires an admin session (OWNER / EDITOR). Customers can't
 *     upload images. SUPPORT is excluded because the role isn't expected
 *     to mutate the catalog.
 *   - Validation: MIME type whitelist + 5 MB size cap. We rely on
 *     Vercel Blob's own scanning for the heavier checks (we don't ship
 *     ClamAV or magic-byte sniffing on the edge runtime).
 *   - Storage: served from Vercel Blob's public bucket — Blob URLs are
 *     unguessable but readable by anyone who has the link (which is the
 *     model we want for product photography).
 *   - Filename: random uuid + the original extension; the original name
 *     is discarded so user-supplied filenames can never be attacker bait.
 *
 * Setup: provision a Blob store in Vercel dashboard → Storage → Create →
 * Blob, then `BLOB_READ_WRITE_TOKEN` is auto-injected into the project's
 * env vars. No code change needed.
 */
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ADMIN_ROLES = new Set(["OWNER", "EDITOR"]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing `file` field." },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported file type: ${file.type || "unknown"}. Use PNG, JPG, WebP or AVIF.`,
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Max ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 400 },
    );
  }

  // Build a deterministic, attacker-resistant filename.
  const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  const safeExt = ext && /^[a-z0-9]{2,5}$/.test(ext) ? ext : "bin";
  const filename = `pastries/${crypto.randomUUID()}.${safeExt}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url, contentType: file.type });
  } catch (err) {
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
