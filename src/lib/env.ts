import { z } from "zod";

/**
 * Validated environment variables for the web app.
 *
 * Design notes:
 *   - `NEXT_PUBLIC_*` values are inlined at build time. Validation happens at
 *     module load.
 *   - For deploys (Vercel etc.) where these aren't yet configured, we **don't
 *     throw** — we fall back to safe defaults so the build can complete, and
 *     log a clear warning in production builds telling the operator to set
 *     them in the host's project settings.
 *   - Server-only values are validated lazily (`serverEnv()`) so client bundles
 *     don't accidentally embed them.
 *
 * What you should set in production (Vercel project → Settings → Environment Variables):
 *   - NEXT_PUBLIC_API_URL    — e.g. https://api.nimievents.co.uk
 *   - NEXT_PUBLIC_WEB_ORIGIN — e.g. https://nimievents.co.uk
 *   - NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_TURNSTILE_SITE_KEY,
 *     NEXT_PUBLIC_PLAUSIBLE_DOMAIN (optional but recommended)
 *   - INTERNAL_API_URL       — same as NEXT_PUBLIC_API_URL or a private hostname
 *   - SENTRY_DSN             — server-side Sentry DSN (optional)
 */

/**
 * Vercel exposes `VERCEL_URL` (and `NEXT_PUBLIC_VERCEL_URL`) without a protocol;
 * use them as a sensible last-resort default for the public origin so preview
 * deploys produce sane absolute URLs (sitemap, OpenGraph, etc.) without manual config.
 */
function vercelDeploymentUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  return raw ? `https://${raw}` : undefined;
}

/** Final fallback when nothing is configured — enough for the build to finish. */
const FALLBACK_API_URL = "http://localhost:3001";
const FALLBACK_WEB_ORIGIN = "http://localhost:3000";

const ServerSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  INTERNAL_API_URL: z.string().url().default(FALLBACK_API_URL),
  SENTRY_DSN: z.string().optional(),
});

const ClientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WEB_ORIGIN: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),

  /** Cal.com username (the slug you pick when signing up — e.g. "nimi-events"). */
  NEXT_PUBLIC_CAL_USERNAME: z.string().optional(),
  /** Cal.com event type slug for the 30-minute paid consultation. */
  NEXT_PUBLIC_CAL_EVENT_30: z.string().default("30min"),
  /** Cal.com event type slug for the 60-minute paid consultation. */
  NEXT_PUBLIC_CAL_EVENT_60: z.string().default("60min"),
});

export type ServerEnv = z.infer<typeof ServerSchema>;
export type ClientEnv = z.infer<typeof ClientSchema>;

let cachedServer: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called from client code.");
  }
  if (cachedServer) return cachedServer;

  const parsed = ServerSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
  });

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid server environment", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment — see logs.");
  }
  cachedServer = parsed.data;
  return cachedServer;
}

/**
 * Resolve the public origin / API URL with a layered fallback:
 *   1. explicit env var
 *   2. Vercel-derived URL (preview deploys)
 *   3. localhost defaults (so the build never crashes)
 */
function resolveClientValues() {
  const vercelOrigin = vercelDeploymentUrl();

  return {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.length > 0
        ? process.env.NEXT_PUBLIC_API_URL
        : FALLBACK_API_URL,
    NEXT_PUBLIC_WEB_ORIGIN:
      process.env.NEXT_PUBLIC_WEB_ORIGIN && process.env.NEXT_PUBLIC_WEB_ORIGIN.length > 0
        ? process.env.NEXT_PUBLIC_WEB_ORIGIN
        : vercelOrigin ?? FALLBACK_WEB_ORIGIN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    NEXT_PUBLIC_CAL_USERNAME: process.env.NEXT_PUBLIC_CAL_USERNAME,
    NEXT_PUBLIC_CAL_EVENT_30: process.env.NEXT_PUBLIC_CAL_EVENT_30,
    NEXT_PUBLIC_CAL_EVENT_60: process.env.NEXT_PUBLIC_CAL_EVENT_60,
  };
}

export const clientEnv: ClientEnv = (() => {
  const resolved = resolveClientValues();

  const parsed = ClientSchema.safeParse(resolved);
  if (!parsed.success) {
    // Should be unreachable: every field has either a value, an explicit
    // default, or is optional. Keep the guard so a future change can't crash
    // the build silently.
    // eslint-disable-next-line no-console
    console.error("Invalid client environment", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment — see logs.");
  }

  // Surface a loud warning when production builds fall back to localhost / vercel
  // preview URLs. Build still succeeds — the operator just needs to configure.
  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      // eslint-disable-next-line no-console
      console.warn(
        "[nimi-web] NEXT_PUBLIC_API_URL is not set — falling back to " +
          parsed.data.NEXT_PUBLIC_API_URL +
          ". Set it in your hosting provider's environment variables before going live.",
      );
    }
    if (!process.env.NEXT_PUBLIC_WEB_ORIGIN) {
      // eslint-disable-next-line no-console
      console.warn(
        "[nimi-web] NEXT_PUBLIC_WEB_ORIGIN is not set — falling back to " +
          parsed.data.NEXT_PUBLIC_WEB_ORIGIN +
          ". Set it in your hosting provider's environment variables before going live.",
      );
    }
  }

  return parsed.data;
})();
