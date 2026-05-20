import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

/**
 * Cart success page — landed on by the customer after Stripe Checkout.
 *
 * Webhook safety net:
 *   Stripe sends `checkout.session.completed` via webhook, but webhook
 *   delivery is best-effort. If the webhook is slow, misrouted, or
 *   blocked by a mis-configured signing secret, the order in our DB
 *   would still read PENDING_PAYMENT and the customer would see a
 *   stale state. To prevent that, we call our own reconcile endpoint
 *   here — passing the `session_id` Stripe stamped into the
 *   success_url. The endpoint asks Stripe directly whether the session
 *   is paid, and if it is, calls the same idempotent handler the
 *   webhook would call. So the customer-facing flow (this page, the
 *   confirmation emails, the in-app notifications, the credit
 *   deduction) all fire even when the webhook never lands.
 *
 *   We run this as a fire-and-forget side effect — if reconciliation
 *   itself errors (network blip, Stripe transient outage), the
 *   customer still sees a friendly "thank you" page. The next time
 *   they reload, or the webhook lands, the order will reach PAID.
 */
export default async function CartSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}) {
  const { order, session_id: sessionId } = await searchParams;

  // Fire the reconcile call. Best-effort — we catch every error so a
  // failure here cannot prevent the customer from seeing their
  // confirmation page. Idempotent: re-running on a PAID order is a
  // no-op on the API side.
  if (order && sessionId) {
    try {
      const cookieHeader = (await cookies()).toString();
      await apiFetch(`/pastry-orders/mine/${encodeURIComponent(order)}/reconcile`, {
        method: "POST",
        headers: { Cookie: cookieHeader },
        body: { sessionId },
        cache: "no-store",
      });
    } catch {
      // Webhook will reconcile eventually; the customer experience
      // is unaffected. Silent failure is intentional here.
    }
  }

  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="eyebrow mb-3">Confirmed</p>
      <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
        Thank you.
      </h1>
      <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
        Your order is in. We&rsquo;ll prepare it freshly and let you know when it&rsquo;s
        on its way.
      </p>

      {order ? (
        <p className="mb-8 border-l-4 border-orange-500 bg-cream-100 px-6 py-4 font-sans text-sm text-neutral-800">
          Reference:{" "}
          <strong className="font-display text-base text-maroon-700">{order}</strong>
        </p>
      ) : null}

      <p className="mb-8 max-w-prose font-sans text-sm text-neutral-700">
        A confirmation email is on its way. You can also see the order in your
        account at any time.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
        >
          View my orders
        </Link>
        <Link
          href="/cravings"
          className="inline-flex items-center justify-center border border-cream-200 bg-cream-100 px-6 py-3 font-display text-lg italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100"
        >
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
