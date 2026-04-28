import "server-only";

import { cookies } from "next/headers";

import { apiFetch } from "./api";

export type Role = "CUSTOMER" | "EDITOR" | "SUPPORT" | "OWNER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerifiedAt: string | null;
}

/**
 * Reads the current session by calling the API's /auth/me endpoint with
 * the request's cookies forwarded. Returns null if unauthenticated.
 *
 * IMPORTANT: this is a server-only helper. Calling it from a Client Component
 * fails the "server-only" import boundary at build time.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;

  try {
    const data = await apiFetch<{ user: SessionUser }>("/auth/me", {
      method: "POST",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
      throwOnError: true,
    });
    return data.user;
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user;
}
