import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge proxy — combines two responsibilities that the runtime executes
 * before any page renders:
 *
 *   1. **Auto-refresh** the access cookie. The access token (`nimi_at`)
 *      carries a 24-hour TTL by default; once it expires, server
 *      components treat the user as anonymous and protected pages
 *      bounce them to `/login`. The refresh cookie (`nimi_rt`) is
 *      configured to ~10 years (`JWT_REFRESH_TTL`), and each
 *      successful refresh rotates the underlying DB row to a fresh
 *      full-TTL expiry, so a returning visitor stays signed in
 *      indefinitely until they explicitly sign out. The proxy
 *      silently exchanges a soon-to-expire access token for a fresh
 *      one and rewrites the incoming request's `cookie` header so
 *      the very same render sees the new value — a hard page refresh
 *      never logs them out.
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
 * Result of attempting to refresh the access token.
 *
 *   "ok"        — refresh succeeded; new tokens included.
 *   "rejected"  — the API definitively rejected the refresh token
 *                 (401 / 403). The token is bad — revoked, expired,
 *                 reused, or never valid. Caller should clear cookies
 *                 and force re-auth.
 *   "transient" — anything else (5xx, network error, timeout). The
 *                 refresh token might still be good; we just couldn't
 *                 reach the API or it hiccupped. Caller MUST NOT
 *                 clear cookies — the next request will try again.
 */
type RefreshOutcome =
  | {
      kind: "ok";
      setCookieHeaders: string[];
      newAccessToken: string | null;
      newRefreshToken: string | null;
    }
  | { kind: "rejected" }
  | { kind: "transient" };

/**
 * Call the API's refresh endpoint with the presented refresh cookie.
 *
 * The outcome distinguishes "the token is bad" from "we couldn't
 * complete the request" so the proxy can be conservative about
 * destroying sessions. Operator policy is sessions-never-expire-on-
 * their-own; only an explicit sign-out or a definitive token
 * rejection should ever log a user out.
 */
async function attemptRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const apiBase = apiBaseUrl();
  if (!apiBase) return { kind: "transient" };

  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(`${apiBase}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      cache: "no-store",
    });
  } catch {
    // Network error, DNS failure, fetch threw. The refresh cookie may
    // still be valid; we just couldn't reach the API. Treat as
    // transient so we don't punish the user for an outage.
    return { kind: "transient" };
  }

  // 401 / 403 means the API has decided this refresh token is no
  // longer valid (revoked, reused, family-bumped after theft, or
  // genuinely expired after the very long TTL). That's the only
  // case where it's safe to clear cookies and force a fresh sign-in.
  if (refreshResponse.status === 401 || refreshResponse.status === 403) {
    return { kind: "rejected" };
  }
  // Anything else non-ok (e.g. 500, 503, 429) — server problem, not
  // an auth problem. Leave cookies alone.
  if (!refreshResponse.ok) {
    return { kind: "transient" };
  }

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
  return { kind: "ok", setCookieHeaders, newAccessToken, newRefreshToken };
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

  if (refreshed.kind === "rejected") {
    // Definitive auth rejection — the refresh token is no longer
    // valid (rotated by another tab, revoked at sign-out, family
    // bumped by reuse detection). Clearing both cookies here is
    // safe and prevents the proxy from looping on every navigation
    // calling /auth/refresh forever.
    const response = protectedRoute
      ? buildLoginRedirect(req)
      : NextResponse.next();
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  if (refreshed.kind === "transient") {
    // The refresh attempt didn't succeed, but the token might still
    // be good — could be a 5xx, a network blip, or a cold Railway
    // dyno taking a moment to wake up. Operator policy is sessions
    // never expire on their own, so we deliberately DO NOT clear
    // cookies here. The next request will try again.
    //
    // For protected routes we still need to do *something* this
    // request, because the page-level `requireSessionUser` will
    // run with the stale access token and bounce to /login anyway.
    // Allowing the page through with a stale cookie would create a
    // worse experience than a clean redirect — so we redirect to
    // login but leave the cookies untouched. On retry (after Railway
    // recovers), the next visit will refresh successfully and the
    // user gets back to where they were.
    return protectedRoute ? buildLoginRedirect(req) : NextResponse.next();
  }

  // Refresh succeeded. Rewrite the incoming request's `cookie` header
  // so server components rendering this same request see the
  // brand-new access token via `cookies()` — no second round-trip
  // required.
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
