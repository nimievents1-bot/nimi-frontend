import { NextResponse, type NextRequest } from "next/server";

/**
 * Auto-refresh middleware.
 *
 * Symptom this solves: "When I refresh the page I get signed out."
 *
 * What was happening: the access token (`nimi_at`) carries a 15-minute
 * TTL. Once it expires, the next `/auth/me` call on a page render
 * returns 401 and `getSessionUser` resolves to null — so the page
 * treats the visitor as anonymous and a protected route bounces them
 * back to /login. There was no automatic token renewal anywhere in
 * the request lifecycle.
 *
 * What this middleware does: on every navigation that could need a
 * session (everything except static assets, RSC payloads, and the API
 * proxy itself) we check whether the access token is fresh enough. If
 * it's missing or within 30 seconds of expiry AND a refresh token
 * (`nimi_rt`) is present, we call the API's refresh endpoint, attach
 * the resulting `Set-Cookie` headers to the outgoing response, and
 * rewrite the incoming request's `Cookie` header so the rendering
 * server component sees the brand-new access token without a second
 * round-trip. The refresh is single-use rotated server-side, so a
 * compromised cookie can't be re-used after the next refresh.
 *
 * Safety:
 *   - We never throw out of middleware. Any failure (network blip,
 *     refresh rejected, API down) silently falls through to the
 *     normal request path; the page then renders for an anonymous
 *     user. That preserves logout semantics and never blocks
 *     navigation.
 *   - The JWT is decoded for its `exp` claim only; we do NOT trust
 *     it for anything else. Signature verification is the API's job.
 *   - The refresh endpoint is rate-limited server-side; the
 *     middleware doesn't add its own retry loop.
 */

const ACCESS_COOKIE = "nimi_at";
const REFRESH_COOKIE = "nimi_rt";
/** Refresh proactively when the access token has 30 s or less of life left. */
const EXPIRY_LEEWAY_MS = 30_000;

/**
 * Decode the JWT payload without verifying the signature. Returns true
 * when the token's `exp` is in the past (or within the leeway window),
 * or when the token is unparseable / lacks an `exp` claim — both cases
 * mean we should attempt a refresh.
 */
function isAccessTokenStale(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    // JWTs use base64url; pad to a multiple of 4 and translate the alphabet
    // before feeding to atob (which only accepts base64).
    const padded = parts[1].padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), "=");
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    // atob is available in the Edge runtime; Buffer is not, so we deliberately
    // use the Web API here to keep this file edge-compatible.
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 <= Date.now() + EXPIRY_LEEWAY_MS;
  } catch {
    return true;
  }
}

/**
 * Choose the upstream API URL the middleware should hit. Prefers the
 * internal/private URL when set (lower latency, no public hop), falls
 * back to the public URL otherwise. Both are stamped into the deploy
 * via Vercel project env vars.
 */
function apiBaseUrl(): string | null {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    null
  );
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  // Nothing to do if there's no refresh token — either the user is
  // genuinely anonymous, or the refresh window has already lapsed.
  if (!refreshToken) {
    return NextResponse.next();
  }

  // Access token is still good — no work needed.
  if (!isAccessTokenStale(accessToken)) {
    return NextResponse.next();
  }

  const apiBase = apiBaseUrl();
  if (!apiBase) {
    // Misconfigured environment. Let the page render anonymously; the
    // operator will see the warning in logs from `getSessionUser`.
    return NextResponse.next();
  }

  try {
    // Hand the refresh cookie back to the API. We deliberately send
    // ONLY the refresh cookie — no access token (it's stale anyway,
    // and the refresh endpoint doesn't need it).
    const refreshResponse = await fetch(`${apiBase}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `${REFRESH_COOKIE}=${refreshToken}`,
      },
      // Edge fetch ignores `credentials` for cross-origin; the Cookie
      // header above is what actually carries the token.
      cache: "no-store",
    });

    if (!refreshResponse.ok) {
      // Refresh failed (rotated by another tab, revoked, expired). Clear
      // the now-useless cookies on the way through so the user is treated
      // cleanly as anonymous on every subsequent request instead of
      // hammering /auth/refresh on each navigation.
      const response = NextResponse.next();
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }

    // Read the new cookies from the API response and forward them to
    // the browser. `getSetCookie()` returns each Set-Cookie header
    // separately (preserving each cookie's own Path / Max-Age / etc.).
    const setCookieHeaders = refreshResponse.headers.getSetCookie?.() ?? [];

    // We also want the freshly-issued access token to be visible to
    // THIS render's server components without waiting for a second
    // round-trip. Parse the new access cookie out of the API response
    // and rewrite the incoming request's Cookie header accordingly.
    let newAccessToken: string | null = null;
    let newRefreshToken: string | null = null;
    for (const raw of setCookieHeaders) {
      const firstSegment = raw.split(";")[0];
      const eqIdx = firstSegment?.indexOf("=") ?? -1;
      if (!firstSegment || eqIdx === -1) continue;
      const name = firstSegment.slice(0, eqIdx).trim();
      const value = firstSegment.slice(eqIdx + 1).trim();
      if (name === ACCESS_COOKIE) newAccessToken = value;
      else if (name === REFRESH_COOKIE) newRefreshToken = value;
    }

    // Build the rewritten request headers. Replace the stale cookies in
    // the incoming `cookie` header so the downstream server component's
    // `cookies()` reflects the refreshed values.
    const requestHeaders = new Headers(request.headers);
    const incomingCookie = requestHeaders.get("cookie") ?? "";
    const cookieParts = incomingCookie
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .filter((c) => {
        const name = c.split("=")[0];
        return name !== ACCESS_COOKIE && name !== REFRESH_COOKIE;
      });
    if (newAccessToken) cookieParts.push(`${ACCESS_COOKIE}=${newAccessToken}`);
    if (newRefreshToken) cookieParts.push(`${REFRESH_COOKIE}=${newRefreshToken}`);
    requestHeaders.set("cookie", cookieParts.join("; "));

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Append (don't replace) so callers that set their own cookies
    // later in the response keep working.
    for (const cookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch {
    // Network blip or upstream timeout. Don't block the navigation —
    // the user will simply appear anonymous for this request.
    return NextResponse.next();
  }
}

/**
 * Skip middleware for paths that can never need a refresh:
 *   - /api/*       — the Vercel rewrite to Railway is itself an API path;
 *                    running the refresh on every API hop would double-call.
 *   - /_next/*     — Next.js internals.
 *   - Static files — images, fonts, CSS, JS, manifest, favicon.
 *
 * Everything else (pages, RSC payloads, route handlers in /app) runs
 * through the matcher. RSC payloads need the refresh too because the
 * server component tree that produces them reads `cookies()` and would
 * see the stale token without it.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
