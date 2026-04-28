import { type Metadata } from "next";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { requireSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Security",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = new Set(["OWNER", "EDITOR", "SUPPORT"]);

export default async function SecurityPage() {
  const user = await requireSessionUser();
  // Note: we don't expose whether MFA is currently enabled here — that comes
  // from the API. To keep the UI honest without a round-trip, the setup page
  // is the single source of truth and shows the live state.

  const isAdmin = ADMIN_ROLES.has(user.role);

  return (
    <>
      <p className="eyebrow mb-2">Account · Security</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">Security</h1>

      <section className="mb-8 border border-cream-200 bg-paper p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 mb-2 font-display text-2xl font-medium text-maroon-600">
              Two-step verification
            </h2>
            <p className="m-0 max-w-prose font-sans text-base text-neutral-700">
              Add an extra layer of security with a TOTP authenticator app (Google Authenticator,
              1Password, Authy, etc.).
              {isAdmin ? " Required for admin access." : ""}
            </p>
          </div>
          {isAdmin ? <Tag variant="orange">Required</Tag> : null}
        </div>

        <div className="mt-5">
          <Link
            href="/account/security/mfa"
            className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
          >
            Set up authenticator
          </Link>
        </div>
      </section>

      <section className="border border-cream-200 bg-paper p-6">
        <h2 className="m-0 mb-2 font-display text-2xl font-medium text-maroon-600">Password</h2>
        <p className="m-0 max-w-prose font-sans text-base text-neutral-700">
          Change your password by signing out and using the &ldquo;Forgot password&rdquo; flow.
          A first-class change-password form lands in Phase 7.1.
        </p>
      </section>
    </>
  );
}
