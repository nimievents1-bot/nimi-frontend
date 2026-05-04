/**
 * Security headers for the marketing site.
 * The CSP is intentionally tight; if a third-party widget needs adding,
 * extend the relevant directive here rather than loosening defaults.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * Where the NestJS API lives. Read at build time so Vercel can stamp the
 * correct upstream into the rewrite rules below.
 *
 * Set this in Vercel project settings as `NEXT_PUBLIC_API_URL` (it must be
 * `NEXT_PUBLIC_*` so the browser bundle can also see it for typed-error
 * handling and analytics, but the rewrite below means the browser actually
 * talks to a same-origin path; the URL is only used here as the upstream
 * target).
 *
 * Falls back to localhost in dev so a fresh clone "just works".
 */
const apiUpstream =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Allow images from R2 once configured. Replace with your subdomain.
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      // Stand-in marketing photography from Unsplash. Remove once
      // brand-shot photography is hosted on R2.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /**
   * Same-origin proxy for the API.
   *
   * Why this matters: cookies set by Set-Cookie are bound to the *response
   * host*. Without this rewrite, the browser stores `nimi_at` / `nimi_rt`
   * on `*.up.railway.app` (the API origin) and never sends them to
   * `nimievents.com` — so SSR-rendered routes like `/account` see no
   * session and redirect back to /login.
   *
   * With this rewrite, the browser hits `/api/v1/*` on `nimievents.com`,
   * Vercel transparently proxies to the Railway API, the Set-Cookie comes
   * back via Vercel and the browser stores the cookie on `nimievents.com`.
   * Subsequent same-origin requests (including the Next.js SSR's incoming
   * request) carry the cookie automatically. No CORS preflight, no
   * SameSite=None hoops, no domain mismatch.
   *
   * Note: the upstream URL is the Railway public URL. Server-side code
   * (`getSessionUser` etc.) talks directly to Railway via `INTERNAL_API_URL`
   * for lower latency — only the browser path goes through this rewrite.
   */
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUpstream}/api/v1/:path*`,
      },
    ];
  },
};

export default config;
