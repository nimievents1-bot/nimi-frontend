import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

interface OrderItem {
  id: string;
  itemSnapshot: { name: string; description: string | null; imageUrl: string | null };
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

interface CustomerOrder {
  id: string;
  reference: string;
  status:
    | "PENDING_PAYMENT"
    | "PAID"
    | "PREPARING"
    | "READY"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  subtotalMinor: number;
  creditAppliedMinor: number;
  /**
   * Discount applied via promo code (birthday treat, welcome code, etc.)
   * in minor units. Zero when no code was used.
   */
  promoDiscountMinor?: number;
  totalMinor: number;
  currency: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

const STATUS_VARIANT: Record<
  CustomerOrder["status"],
  "orange" | "neutral" | "success" | "maroon"
> = {
  PENDING_PAYMENT: "orange",
  PAID: "success",
  PREPARING: "neutral",
  READY: "neutral",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "maroon",
  REFUNDED: "maroon",
};

const STATUS_DESCRIPTION: Record<CustomerOrder["status"], string> = {
  PENDING_PAYMENT: "Waiting on payment to clear. We'll start as soon as it does.",
  PAID: "We've got your order. The kitchen will pick it up shortly.",
  PREPARING: "Your order is being made fresh.",
  READY: "Ready for dispatch — heading your way soon.",
  SHIPPED: "Out for delivery. Should reach you shortly.",
  DELIVERED: "Delivered. We hope every bite was worth it.",
  CANCELLED: "Cancelled. Any payment is refunded; any credits are returned.",
  REFUNDED: "Refunded. Credits and payment have been returned.",
};

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function CustomerOrderDetail({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const cookieHeader = (await cookies()).toString();

  let order: CustomerOrder | null = null;
  let fetchError: string | null = null;
  try {
    order = await apiFetch<CustomerOrder>(`/pastry-orders/mine/${reference}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    fetchError = err instanceof Error ? err.message : "Failed to load order.";
  }

  if (fetchError) {
    return (
      <Alert variant="danger" className="mt-6">
        Couldn&rsquo;t load this order: {fetchError}
      </Alert>
    );
  }
  if (!order) notFound();

  return (
    <>
      <p className="eyebrow mb-2">
        Your account ·{" "}
        <Link href="/account/orders" className="text-orange-700 underline underline-offset-4">
          back to orders
        </Link>
      </p>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 font-mono text-3xl font-medium text-maroon-600">
          {order.reference}
        </h1>
        <Tag variant={STATUS_VARIANT[order.status]}>
          {order.status.replace(/_/g, " ").toLowerCase()}
        </Tag>
      </div>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        {STATUS_DESCRIPTION[order.status]}
      </p>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-8">
          <div className="border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Items
            </h2>
            <ul className="m-0 list-none space-y-3 p-0">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-3 border-b border-cream-200 pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="m-0 font-display text-lg text-maroon-700">
                      {item.itemSnapshot.name}
                    </p>
                    {item.itemSnapshot.description ? (
                      <p className="m-0 max-w-prose font-sans text-sm text-neutral-600">
                        {item.itemSnapshot.description}
                      </p>
                    ) : null}
                    <p className="m-0 font-sans text-xs text-neutral-500">
                      {item.quantity} × {fmt(item.unitPriceMinor, order.currency)}
                    </p>
                  </div>
                  <span className="font-display text-base text-maroon-600">
                    {fmt(item.totalMinor, order.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 grid grid-cols-[1fr_auto] gap-y-2 border-t border-cream-200 pt-4 font-sans text-sm">
              <dt className="text-neutral-700">Subtotal</dt>
              <dd className="text-right text-neutral-900">
                {fmt(order.subtotalMinor, order.currency)}
              </dd>
              {order.promoDiscountMinor && order.promoDiscountMinor > 0 ? (
                <>
                  <dt className="text-neutral-700">Promo code</dt>
                  <dd className="text-right text-orange-700">
                    −{fmt(order.promoDiscountMinor, order.currency)}
                  </dd>
                </>
              ) : null}
              {order.creditAppliedMinor > 0 ? (
                <>
                  <dt className="text-neutral-700">Indulgence Credits</dt>
                  <dd className="text-right text-orange-700">
                    −{fmt(order.creditAppliedMinor, order.currency)}
                  </dd>
                </>
              ) : null}
              <dt className="border-t border-cream-200 pt-3 font-medium text-maroon-700">
                Paid
              </dt>
              <dd className="border-t border-cream-200 pt-3 text-right font-display text-xl text-maroon-700">
                {fmt(order.totalMinor, order.currency)}
              </dd>
            </dl>
          </div>

          <div className="border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Delivery
            </h2>
            <p className="m-0 font-sans text-sm text-neutral-800">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
              <br />
              {order.shippingCity}, {order.shippingPostcode}
              <br />
              {order.shippingCountry}
            </p>
            {order.notes ? (
              <p className="mt-3 font-sans text-sm italic text-neutral-700">
                Note to kitchen: {order.notes}
              </p>
            ) : null}
          </div>
        </section>

        <aside>
          <div className="border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Timeline
            </h2>
            <ul className="m-0 list-none space-y-2 p-0 font-sans text-sm">
              <li className="flex items-baseline justify-between gap-4">
                <span className="text-neutral-700">Placed</span>
                <span className="text-neutral-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </li>
              <TimelineEntry label="Paid" at={order.paidAt} />
              <TimelineEntry label="Preparing" at={order.preparingAt} />
              <TimelineEntry label="Ready" at={order.readyAt} />
              <TimelineEntry label="Shipped" at={order.shippedAt} />
              <TimelineEntry label="Delivered" at={order.deliveredAt} />
              {order.cancelledAt ? (
                <TimelineEntry label="Cancelled" at={order.cancelledAt} />
              ) : null}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function TimelineEntry({ label, at }: { label: string; at: string | null }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-neutral-700">{label}</span>
      <span className="text-neutral-500">
        {at ? new Date(at).toLocaleString() : "—"}
      </span>
    </li>
  );
}
