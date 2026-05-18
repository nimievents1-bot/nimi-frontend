import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Alert } from "@/components/primitives/Alert";
import { apiFetch } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth";

import { ProfileForm, type Profile } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/**
 * Customer-facing profile page. Loads the editable shape (name + phone
 * + default delivery address) server-side so the form pre-fills on
 * the first paint with no client-side fetch flicker. The actual
 * mutation runs in the client `ProfileForm` against `PATCH /profile`.
 *
 * Auth-sensitive fields (email change, password, MFA) deliberately
 * stay on `/account/security` and `/account/security/mfa` — those
 * have separate confirmation flows we don't want to dilute here.
 */
export default async function ProfilePage() {
  // requireSessionUser bounces unauthenticated visitors to /login.
  await requireSessionUser();
  const cookieHeader = (await cookies()).toString();

  let profile: Profile | null = null;
  let loadError: string | null = null;
  try {
    profile = await apiFetch<Profile>("/profile", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Couldn't load your profile.";
  }

  return (
    <>
      <p className="eyebrow mb-3">Account · Profile</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Your details
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Your contact details and default delivery address. The address is used to pre-fill
        the cart at checkout and tells our kitchen where to send any Indulgence Club deliveries.
      </p>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {profile ? <ProfileForm initial={profile} /> : null}
    </>
  );
}
