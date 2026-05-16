import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { Card } from "@/components/patterns/Card";
import { requireSessionUser, type Role } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

/**
 * Roles that should land on the admin dashboard rather than the customer
 * account overview. Kept in sync with the client-side default in
 * `app/(auth)/login/LoginForm.tsx` and the server-side guards on
 * `/admin/*` pages.
 *
 * Note: SUPPORT is included here even though it doesn't currently have
 * a presence on the admin sidebar — the role is reserved for future use
 * and we'd rather not send them to a customer overview by accident.
 */
const isStaffRole = (role: Role): boolean =>
  role === "OWNER" || role === "EDITOR" || role === "SUPPORT";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; as?: string }>;
}) {
  const user = await requireSessionUser();
  const { status, as } = await searchParams;

  // Staff who land here through any route — login fallback, bookmark,
  // direct URL, post-MFA — are bumped to the admin dashboard. An owner
  // who deliberately wants the customer view can pass `?as=customer` to
  // bypass this (e.g. for testing a customer-facing change). This escape
  // hatch is intentionally undocumented in the UI to discourage habitual
  // use; it exists so we don't lock ourselves out of the customer view.
  if (isStaffRole(user.role) && as !== "customer") {
    redirect("/admin");
  }

  const showWelcome = status === "welcome";
  const verifyPending = !user.emailVerifiedAt;

  // Defensive: if a legacy session-payload arrives without `name`, derive
  // a sensible greeting from the email rather than crashing the page.
  // This complements the API-side fallback in jwt.strategy.ts.
  const greetingName = (user.name?.trim() || user.email.split("@")[0] || "there").split(" ")[0];

  return (
    <>
      <p className="eyebrow mb-3">Welcome</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Hello, {greetingName}.
      </h1>

      {showWelcome ? (
        <Alert variant="success" className="mb-4">
          Your account is ready. We sent a verification email — confirm it when you have a moment.
        </Alert>
      ) : null}

      {verifyPending && !showWelcome ? (
        <Alert variant="warning" className="mb-4">
          Your email isn&rsquo;t verified yet. Some features will unlock once you confirm.
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card
          eyebrow="Bookings"
          title="Catering & event enquiries"
          description="See your active enquiries and replies from our team."
          href="/account/bookings"
          mediaStyle={{ background: "linear-gradient(135deg,#FAE3D1,#E48039)" }}
        />
        <Card
          eyebrow="Gifting"
          title="Gift orders"
          description="Order history, design approvals, and reorder shortcuts."
          href="/account/orders"
          mediaStyle={{ background: "linear-gradient(135deg,#ECA068,#92381A)" }}
        />
        <Card
          eyebrow="Cravings"
          title="Pastry subscription"
          description="Plan, balance, transactions — and pause when life gets busy."
          href="/account/subscription"
          mediaStyle={{ background: "linear-gradient(135deg,#DDA092,#5C1F18)" }}
        />
      </div>
    </>
  );
}
