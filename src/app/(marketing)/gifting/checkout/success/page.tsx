import { type Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

interface OrderSummary {
  reference: string;
  status: string;
  email: string;
  totalMinor: number;
  currency: string;
  items: Array<{
    quantity: number;
    unitPriceMinor: number;
    totalMinor: number;
    collectionSnapshot: { name?: string } | null;
    collection?: { name: string; slug: string } | null;
  }>;
}

/**
 * Gifting checkout success page — landed on by the customer after Stripe
 * Checkout for a gift order.
 *
 * Webhook safety net:
 *   Stripe sends `checkout.session.completed` via webhook, but webhook
 *   delivery is best-effort. If the webhook is slow, misrouted, or
 *   blocked by a mis-configured signing secret, the gift order in our
 *   DB would still read PENDING_PAYMENT and the customer would see a
 *   stale state — and crucially, the AWAITING_DESIGN_APPROVAL
 *   transition (which fires the customer receipt and admin notification
 *   emails) would never happen. To prevent that, we call our own
 *   reconcile endpoint here — passing the `session_id` Stripe stamped
 *   into the success URL. The endpoint asks Stripe directly whether
 *   the session is paid, and if it is, calls the same idempotent
 *   handler the webhook would call. So the customer-facing flow (this
 *   page, the confirmation emails, the in-app notifications, the staff
 *   bell) all fire even when the webhook never lands.
 *
 *   This mirrors the pattern on the pastry cart success page. The
 *   gifting flow was missing it for the first few weeks of production,
 *   which is why early gift orders sat in PENDING_PAYMENT and never
 *   triggered emails — pastry orders worked because of their safety
 *   net, gifting didn't because it had none. Adding it closes that gap.
 *
 *   We run reconcile as a fire-and-forget side effect BEFORE we read
 *   the order so the read picks up the freshly-updated status. If
 *   reconciliation itself errors (network blip, Stripe transient
 *   outage), the customer still sees a friendly "thank you" page; the
 *   next webhook retry (or refresh of this page) will move the order
 *   forward.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; session_id?: string }>;
}) {
  const { ref, session_id: sessionId } = await searchParams;
  if (!ref) {
    return (
      <AuthShell title="Missing order reference" eyebrow="Order">
        <Alert variant="danger">No order reference was provided in the link.</Alert>
      </AuthShell>
    );
  }

  // Fire the reconcile call. Best-effort — we catch every error so a
  // failure here cannot prevent the customer from seeing their
  // confirmation page. Idempotent: re-running on a paid order is a
  // no-op on the API side.
  if (sessionId) {
    try {
      await apiFetch(
        `/gifting/orders/by-reference/${encodeURIComponent(ref)}/reconcile`,
        {
          method: "POST",
          body: { sessionId },
          cache: "no-store",
        },
      );
    } catch {
      // Webhook will reconcile eventually; the customer experience is
      // unaffected. Silent failure is intentional here.
    }
  }

  let order: OrderSummary | null = null;
  try {
    order = await apiFetch<OrderSummary>(`/gifting/orders/by-reference/${ref}`, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    /* ignore */
  }

  if (!order) {
    return (
      <AuthShell eyebrow="Order" title="We couldn't find that order">
        <Alert variant="danger">
          The order reference is invalid. If you completed payment, check your email — you should
          have a receipt from Stripe.
        </Alert>
      </AuthShell>
    );
  }

  const fmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: order.currency.toUpperCase(),
  });

  return (
    <AuthShell
      eyebrow="Order received"
      title="Thank you."
      lede={`Reference ${order.reference}. We'll be in touch within one working day.`}
    >
      <Alert variant="success" className="mb-6">
        We&rsquo;ve sent a receipt to <strong>{order.email}</strong>. The next step is the design
        mock-up — we&rsquo;ll email it to you for approval before production begins.
      </Alert>

      <div className="mb-8 border border-cream-200 bg-paper p-5">
        <p className="m-0 mb-3 font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
          What you ordered
        </p>
        {order.items.map((item, idx) => {
          const name =
            item.collection?.name ?? item.collectionSnapshot?.name ?? "Gift collection";
          return (
            <div
              key={idx}
              className="flex items-baseline justify-between border-b border-cream-200 py-2"
            >
              <span className="font-display text-lg text-maroon-600">
                {item.quantity} × {name}
              </span>
              <span className="font-sans text-base text-neutral-800">
                {fmt.format(item.totalMinor / 100)}
              </span>
            </div>
          );
        })}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-sans text-base font-semibold text-neutral-800">Total</span>
          <span className="font-display text-xl font-semibold text-maroon-600">
            {fmt.format(order.totalMinor / 100)}
          </span>
        </div>
        <div className="mt-4">
          <Tag variant="orange">{order.status.replace(/_/g, " ").toLowerCase()}</Tag>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/account/orders/gift/${encodeURIComponent(order.reference)}`}>
          <Button>View this order</Button>
        </Link>
        <Link href="/account/orders">
          <Button variant="secondary">All your orders</Button>
        </Link>
      </div>
    </AuthShell>
  );
}
