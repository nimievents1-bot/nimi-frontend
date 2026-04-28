import { NextResponse } from "next/server";

/**
 * Liveness probe for the web app.
 * Returns immediately; does not depend on the API or DB.
 *
 * Intended for: load-balancer health checks, uptime monitors.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "nimi-web",
    time: new Date().toISOString(),
  });
}
