import { type Metadata } from "next";

import { Alert } from "@/components/primitives/Alert";
import { Card } from "@/components/patterns/Card";
import { requireSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await requireSessionUser();

  const showWelcome = searchParams.status === "welcome";
  const verifyPending = !user.emailVerifiedAt;

  return (
    <>
      <p className="eyebrow mb-3">Welcome</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Hello, {user.name.split(" ")[0]}.
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
