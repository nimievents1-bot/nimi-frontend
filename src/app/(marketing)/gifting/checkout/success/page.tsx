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
    collectionSnapshot: { name: string };
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref;
  if (!ref) {
    return (
      <AuthShell title="Missing order reference" eyebrow="Order">
        <Alert variant="danger">No order reference was provided in the link.</Alert>
      </AuthShell>
    );
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
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-baseline justify-between border-b border-cream-200 py-2">
            <span className="font-display text-lg text-maroon-600">
              {item.quantity} × {item.collectionSnapshot.name}
            </span>
            <span className="font-sans text-base text-neutral-800">
              {fmt.format(item.totalMinor / 100)}
            </span>
          </div>
        ))}
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

      <Link href="/account/orders">
        <Button>View your orders</Button>
      </Link>
    </AuthShell>
  );
}
