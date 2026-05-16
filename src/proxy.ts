import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge proxy — combines two responsibilities that the runtime executes
 * before any page renders:
 *
 *   1. **Auto-refresh** the access cookie. The access token (`nimi_at`)
 *      carries a 15-minute TTL; once it expires, server components
 *      treat the user as anonymous and protected pages bounce them to
 *      `/login`. The refresh cookie (`nimi_rt`) is valid for 30 days,
 *      so this proxy silently exchanges a soon-to-expire access token
 *      for a fresh one and rewrites the incoming request's `cookie`
 *      header so the very same render sees the new value. Result: the
 *      user effectively stays signed in for the refresh-token window
 *      with no perceptible interruption — a hard page refresh no
 *      longer logs them out.
 *
 *   2. **Route protection** for the authenticated route groups
 *      (`/account/*`, `/admin/*`). If the visitor lands there without
 *      a valid session — and the refresh attempt couldn't recover
 *      one — redirect to `/login?next=...` so the post-auth landing
 *      brings them back where they meant to go. The authoritative
 *      check still happens server-side in `requireSessionUser`; this
 *      is just an early-exit so we don't burn a server render on a
 *      visitor we already know is anonymous.
 *
 * Both pieces live in this single proxy so we only run the matcher
 * once per request and only call the refresh endpoint at most once
 * per navigation.
 *
 * Safety:
 *   - This function NEVER throws out. Any error in the refresh path
 *     falls back to "treat the user as anonymous"; navigation is
 *     never blocked by an upstream blip.
 *   - The JWT is decoded for its `exp` claim ONLY. Signature
 *     verification stays at the API.
 *   - The refresh endpoint is rate-limited server-side, so a
 *     pathological client can't use this proxy as an amplifier.
 */

const ACCESS_COOKIE = "nimi_at";
const REFRESH_COOKIE = "nimi_rt";

/**
 * Pre-emptive refresh window — if the access token has 30 s or less of
 * life left, refresh now instead of letting the next render miss it.
 */
const EXPIRY_LEEWAY_MS = 30_000;

/** Path prefixes that require an authenticated session. */
const PROTECTED_PREFIXES = ["/account", "/admin"] as const;

/**
 * Decode the JWT payload (no signature check — that's the API's job)
 * and return true when the token is missing, unparseable, lacks an
 * `exp` claim, or is within `EXPIRY_LEEWAY_MS` of expiry.
 */
function isAccessTokenStale(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    // JWTs use base64url; pad to a multiple of 4 and translate the
    // alphabet before feeding to atob (which only accepts base64).
    const padded = parts[1].padEnd(
      parts[1].length + ((4 - (parts[1].length % 4)) % 4),
      "=",
    );
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    // atob is available in the Edge runtime; Buffer is not, so we
    // deliberately use the Web API here to keep this file edge-safe.
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 <= Date.now() + EXPIRY_LEEWAY_MS;
  } catch {
    return true;
  }
}

function apiBaseUrl(): string | null {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    null
  );
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Build the `/login?next=...` redirect that protected pages fall through to. */
function buildLoginRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Call the API's refresh endpoint with the presented refresh cookie.
 * Returns the parsed `Set-Cookie` array and the new access/refresh
 * token values when successful, or `null` on any failure.
 */
async function attemptRefresh(refreshToken: string): Promise<{
  setCookieHeaders: string[];
  newAccessToken: string | null;
  newRefreshToken: string | null;
} | null> {
  const apiBase = apiBaseUrl();
  if (!apiBase) return null;

  try {
    const refreshResponse = await fetch(`${apiBase}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      cache: "no-store",
    });
    if (!refreshResponse.ok) return null;

    const setCookieHeaders = refreshResponse.headers.getSetCookie?.() ?? [];
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
    return { setCookieHeaders, newAccessToken, newRefreshToken };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const pathname = req.nextUrl.pathname;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const protectedRoute = isProtectedPath(pathname);

  // Genuinely anonymous visitor — no tokens at all.
  if (!refreshToken && !accessToken) {
    return protectedRoute ? buildLoginRedirect(req) : NextResponse.next();
  }

  // Access token still good — no work needed.
  if (!isAccessTokenStale(accessToken)) {
    return NextResponse.next();
  }

  // Access is stale; try to recover by refreshing.
  if (!refreshToken) {
    // No refresh token to spend. Clear any lingering stale access
    // cookie so the user is treated cleanly as anonymous from here.
    const response = protectedRoute
      ? buildLoginRedirect(req)
      : NextResponse.next();
    response.cookies.delete(ACCESS_COOKIE);
    return response;
  }

  const refreshed = await attemptRefresh(refreshToken);
  if (!refreshed) {
    // Refresh failed (rotated by another tab, revoked, expired, network
    // blip, family-reuse detected). Clear both cookies so we don't loop
    // on every navigation, then either redirect or fall through.
    const response = protectedRoute
      ? buildLoginRedirect(req)
      : NextResponse.next();
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  // Rewrite the incoming request's `cookie` header so server
  // components rendering this same request see the brand-new access
  // token via `cookies()` — no second round-trip required.
  const requestHeaders = new Headers(req.headers);
  const incomingCookie = requestHeaders.get("cookie") ?? "";
  const cookieParts = incomingCookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .filter((c) => {
      const name = c.split("=")[0];
      return name !== ACCESS_COOKIE && name !== REFRESH_COOKIE;
    });
  if (refreshed.newAccessToken) cookieParts.push(`${ACCESS_COOKIE}=${refreshed.newAccessToken}`);
  if (refreshed.newRefreshToken) cookieParts.push(`${REFRESH_COOKIE}=${refreshed.newRefreshToken}`);
  requestHeaders.set("cookie", cookieParts.join("; "));

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Forward the refreshed Set-Cookie headers to the browser so future
  // requests carry the fresh tokens. Append (don't replace) so any
  // downstream cookies set by the page render also reach the client.
  for (const cookie of refreshed.setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

/**
 * Run the proxy on every page navigation that could need a session.
 *
 * The matcher excludes:
 *   - `/api/*`        — the Vercel rewrite to Railway lives here and
 *                       shouldn't be intercepted by the refresh logic.
 *   - `/_next/*`      — Next internals.
 *   - Static assets   — images, fonts, CSS, JS, manifest, favicon.
 *
 * Everything else — pages and RSC payload requests (those carry
 * `?_rsc=…` but the pathname still matches the page) — runs through
 * the proxy, which is exactly what we need: RSC renders read `cookies()`
 * too and would see a stale token without the rewrite.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
