import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Gift order",
  robots: { index: false, follow: false },
};

/**
 * Customer-facing gift order detail. Mirrors the pastry order detail
 * page in structure (Hero + status banner + items + delivery + timeline)
 * but uses the gift-specific status pipeline so the customer can see
 * exactly where in the design/production lifecycle their order is.
 *
 * Authenticated only — the API enforces ownership (the order's `userId`
 * must match the signed-in caller); a 404 here means either the
 * reference doesn't exist OR it belongs to someone else.
 */

type GiftOrderStatus =
  | "PENDING_PAYMENT"
  | "AWAITING_DESIGN_APPROVAL"
  | "DESIGN_SENT"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

interface GiftOrderItem {
  id: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  customisation: {
    names?: string | null;
    dates?: string | null;
    colourTheme?: string | null;
    message?: string | null;
    logoUrl?: string | null;
  } | null;
  collectionSnapshot: { name?: string; description?: string; items?: string[] } | null;
  collection?: { name: string; slug: string } | null;
}

interface GiftOrder {
  id: string;
  reference: string;
  status: GiftOrderStatus;
  totalMinor: number;
  currency: string;
  email: string;
  name: string;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostcode: string | null;
  shippingCountry: string | null;
  trackingNumber: string | null;
  notes: string | null;
  designApprovalAccepted: boolean;
  createdAt: string;
  paidAt: string | null;
  approvedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: GiftOrderItem[];
}

const STATUS_DISPLAY: Record<
  GiftOrderStatus,
  { label: string; variant: "neutral" | "orange" | "success" | "maroon"; helper: string }
> = {
  PENDING_PAYMENT: {
    label: "Payment pending",
    variant: "orange",
    helper: "We're waiting for payment to confirm before we begin.",
  },
  AWAITING_DESIGN_APPROVAL: {
    label: "Designing",
    variant: "orange",
    helper:
      "Payment received. Our team is preparing your design mock-up — you'll get an email when it's ready to review.",
  },
  DESIGN_SENT: {
    label: "Design sent",
    variant: "orange",
    helper:
      "We've sent your design through. Please review it and reply with approval or any changes you'd like before we start production.",
  },
  IN_PRODUCTION: {
    label: "In production",
    variant: "orange",
    helper: "Design approved — your gift boxes are being made.",
  },
  SHIPPED: {
    label: "Shipped",
    variant: "success",
    helper: "Your order is on its way.",
  },
  DELIVERED: {
    label: "Delivered",
    variant: "success",
    helper: "Your order has arrived. We hope it lands beautifully.",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "maroon",
    helper: "This order has been cancelled. Any payment will be refunded to your original card.",
  },
  REFUNDED: {
    label: "Refunded",
    variant: "maroon",
    helper: "Your payment has been refunded in full.",
  },
};

const fmt = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function GiftOrderDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  await requireSessionUser();
  const { reference } = await params;
  const cookieHeader = (await cookies()).toString();

  let order: GiftOrder | null = null;
  let loadError: string | null = null;
  try {
    order = await apiFetch<GiftOrder>(
      `/gifting/orders/me/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    loadError = err instanceof Error ? err.message : "Couldn't load your gift order.";
  }

  return (
    <>
      <p className="eyebrow mb-2">
        <Link href="/account/orders" className="text-orange-700 underline underline-offset-4">
          Account · Orders
        </Link>{" "}
        · Gift order
      </p>
      <h1 className="m-0 mb-2 font-display text-5xl font-medium text-maroon-600">
        {order ? order.reference : "Gift order"}
      </h1>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {order ? (
        <>
          {(() => {
            const display = STATUS_DISPLAY[order.status];
            return (
              <div className="mb-8 flex flex-wrap items-start gap-4 border-l-4 border-orange-500 bg-cream-100 px-6 py-5">
                <Tag variant={display.variant}>{display.label}</Tag>
                <p className="m-0 max-w-prose font-sans text-base text-neutral-700">
                  {display.helper}
                </p>
              </div>
            );
          })()}

          {/* Items + customisation */}
          <section className="mb-8">
            <h2 className="m-0 mb-3 font-display text-2xl text-maroon-600">What you ordered</h2>
            <div className="grid gap-4">
              {order.items.map((item) => {
                const snap = item.collectionSnapshot ?? {};
                const name = item.collection?.name ?? snap.name ?? "Gift collection";
                const cust = item.customisation;
                return (
                  <article key={item.id} className="border border-cream-200 bg-paper p-5">
                    <header className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="m-0 font-display text-xl text-maroon-600">
                        {item.quantity}× {name}
                      </h3>
                      <span className="font-display text-lg text-orange-700">
                        {fmt(item.totalMinor, order!.currency)}
                      </span>
                    </header>
                    {snap.description ? (
                      <p className="m-0 mb-3 max-w-prose font-sans text-sm text-neutral-700">
                        {snap.description}
                      </p>
                    ) : null}
                    {cust ? (
                      <dl className="grid gap-x-6 gap-y-2 font-sans text-sm text-neutral-700 md:grid-cols-2">
                        {cust.names ? (
                          <div>
                            <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                              Names
                            </dt>
                            <dd className="text-neutral-800">{cust.names}</dd>
                          </div>
                        ) : null}
                        {cust.dates ? (
                          <div>
                            <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                              Dates
                            </dt>
                            <dd className="text-neutral-800">{cust.dates}</dd>
                          </div>
                        ) : null}
                        {cust.colourTheme ? (
                          <div>
                            <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                              Colour theme
                            </dt>
                            <dd className="text-neutral-800">{cust.colourTheme}</dd>
                          </div>
                        ) : null}
                        {cust.message ? (
                          <div className="md:col-span-2">
                            <dt className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                              Custom message
                            </dt>
                            <dd className="whitespace-pre-line text-neutral-800">
                              {cust.message}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          {/* Delivery */}
          {order.shippingLine1 ? (
            <section className="mb-8">
              <h2 className="m-0 mb-3 font-display text-2xl text-maroon-600">Deliver to</h2>
              <address className="not-italic font-sans text-base text-neutral-800">
                {order.name}
                <br />
                {order.shippingLine1}
                <br />
                {order.shippingLine2 ? (
                  <>
                    {order.shippingLine2}
                    <br />
                  </>
                ) : null}
                {order.shippingCity ? `${order.shippingCity} ` : ""}
                {order.shippingPostcode ?? ""}
                <br />
                {order.shippingCountry ?? "GB"}
              </address>
              {order.trackingNumber ? (
                <p className="mt-3 font-sans text-sm text-neutral-700">
                  Tracking number:{" "}
                  <strong className="font-display text-base text-maroon-600">
                    {order.trackingNumber}
                  </strong>
                </p>
              ) : null}
            </section>
          ) : null}

          {/* Notes */}
          {order.notes ? (
            <section className="mb-8">
              <h2 className="m-0 mb-3 font-display text-2xl text-maroon-600">Your notes</h2>
              <p className="m-0 max-w-prose whitespace-pre-line font-sans text-base text-neutral-800">
                {order.notes}
              </p>
            </section>
          ) : null}

          {/* Totals */}
          <section className="mb-8 border-t border-cream-200 pt-4">
            <dl className="ml-auto grid max-w-xs gap-1 font-sans text-base">
              <div className="flex items-baseline justify-between">
                <dt className="text-neutral-700">Total paid</dt>
                <dd className="font-display text-xl text-maroon-600">
                  {fmt(order.totalMinor, order.currency)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Timeline */}
          <section className="mb-8">
            <h2 className="m-0 mb-3 font-display text-2xl text-maroon-600">Timeline</h2>
            <ul className="m-0 list-none space-y-2 p-0 font-sans text-sm text-neutral-700">
              <li>
                <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                  Placed
                </span>{" "}
                · {new Date(order.createdAt).toLocaleString("en-GB")}
              </li>
              {order.paidAt ? (
                <li>
                  <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    Paid
                  </span>{" "}
                  · {new Date(order.paidAt).toLocaleString("en-GB")}
                </li>
              ) : null}
              {order.approvedAt ? (
                <li>
                  <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    Design approved
                  </span>{" "}
                  · {new Date(order.approvedAt).toLocaleString("en-GB")}
                </li>
              ) : null}
              {order.shippedAt ? (
                <li>
                  <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    Shipped
                  </span>{" "}
                  · {new Date(order.shippedAt).toLocaleString("en-GB")}
                </li>
              ) : null}
              {order.deliveredAt ? (
                <li>
                  <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    Delivered
                  </span>{" "}
                  · {new Date(order.deliveredAt).toLocaleString("en-GB")}
                </li>
              ) : null}
            </ul>
          </section>

          <p className="font-sans text-sm text-neutral-500">
            Questions about your order? Reply to your confirmation email — it lands directly
            with our team — or use the{" "}
            <Link
              href="/contact"
              className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
            >
              contact form
            </Link>
            .
          </p>
        </>
      ) : null}
    </>
  );
}
