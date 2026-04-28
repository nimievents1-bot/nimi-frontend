import { z } from "zod";

/**
 * Validated environment variables for the web app.
 *
 * Server-only values are validated lazily (`serverEnv()`) so that
 * client bundles don't accidentally embed them.
 *
 * NEXT_PUBLIC_* values are inlined at build time and validated below
 * inside `clientEnv` — that's why we read each one explicitly.
 */
const ServerSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  INTERNAL_API_URL: z.string().url().default("http://localhost:3001"),
  SENTRY_DSN: z.string().optional(),
});

const ClientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WEB_ORIGIN: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
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
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
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

export const clientEnv: ClientEnv = (() => {
  const parsed = ClientSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_ORIGIN: process.env.NEXT_PUBLIC_WEB_ORIGIN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  });
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid client environment", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment — see logs.");
  }
  return parsed.data;
})();
