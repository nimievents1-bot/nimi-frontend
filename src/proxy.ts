import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — gates the protected route groups.
 *
 * We can't actually validate the JWT here (the secret lives only on the API),
 * so the middleware only checks that the access cookie is *present*. The
 * authoritative check still happens in the page itself via `requireSessionUser`,
 * which calls the API. The middleware's job is just to keep unauthenticated
 * users off the route at the edge so we don't waste a server render.
 */
export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};

const ACCESS_COOKIE = "nimi_at";

export function proxy(req: NextRequest): NextResponse {
  const hasAccess = req.cookies.has(ACCESS_COOKIE);
  if (!hasAccess) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
