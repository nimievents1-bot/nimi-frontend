import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";

import { PastryOrderActions } from "./PastryOrderActions";

export const metadata: Metadata = {
  title: "Pastry order · Admin",
  robots: { index: false, follow: false },
};

interface PastryOrderItem {
  id: string;
  pastryItemId: string | null;
  itemSnapshot: { slug: string; name: string; description: string | null; imageUrl: string | null };
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface PastryOrderDetail {
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
  email: string;
  name: string;
  phone: string | null;
  subtotalMinor: number;
  creditAppliedMinor: number;
  totalMinor: number;
  currency: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  paidAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: PastryOrderItem[];
}

const STATUS_VARIANT: Record<
  PastryOrderDetail["status"],
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

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function AdminPastryOrderDetail({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const cookieHeader = (await cookies()).toString();

  // 404 vs other errors — same convention as the rest of admin detail pages.
  let order: PastryOrderDetail | null = null;
  let fetchError: string | null = null;
  try {
    order = await apiFetch<PastryOrderDetail>(`/admin/pastry-orders/${reference}`, {
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
        Admin · Pastry orders ·{" "}
        <Link
          href="/admin/pastry-orders"
          className="text-orange-700 underline underline-offset-4"
        >
          back to queue
        </Link>
      </p>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 font-mono text-3xl font-medium text-maroon-600">
          {order.reference}
        </h1>
        <Tag variant={STATUS_VARIANT[order.status]}>
          {order.status.replace(/_/g, " ").toLowerCase()}
        </Tag>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Items + customer + financial breakdown */}
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
              <dt className="text-neutral-700">Indulgence Credits</dt>
              <dd className="text-right text-orange-700">
                −{fmt(order.creditAppliedMinor, order.currency)}
              </dd>
              <dt className="border-t border-cream-200 pt-3 font-medium text-maroon-700">
                Charged
              </dt>
              <dd className="border-t border-cream-200 pt-3 text-right font-display text-xl text-maroon-700">
                {fmt(order.totalMinor, order.currency)}
              </dd>
            </dl>
          </div>

          <div className="border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Customer & delivery
            </h2>
            <dl className="grid grid-cols-[140px_1fr] gap-y-3 font-sans text-sm">
              <dt className="text-neutral-500">Name</dt>
              <dd className="text-neutral-800">{order.name}</dd>
              <dt className="text-neutral-500">Email</dt>
              <dd className="text-neutral-800">{order.email}</dd>
              {order.phone ? (
                <>
                  <dt className="text-neutral-500">Phone</dt>
                  <dd className="text-neutral-800">{order.phone}</dd>
                </>
              ) : null}
              <dt className="text-neutral-500">Address</dt>
              <dd className="text-neutral-800">
                {order.shippingLine1}
                {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
                <br />
                {order.shippingCity}, {order.shippingPostcode}
                <br />
                {order.shippingCountry}
              </dd>
              {order.notes ? (
                <>
                  <dt className="text-neutral-500">Customer notes</dt>
                  <dd className="text-neutral-800">{order.notes}</dd>
                </>
              ) : null}
            </dl>
          </div>

          <div className="border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Timeline
            </h2>
            <ul className="m-0 list-none space-y-2 p-0 font-sans text-sm">
              <TimelineRow label="Order placed" at={order.createdAt} />
              <TimelineRow label="Paid" at={order.paidAt} />
              <TimelineRow label="Preparing" at={order.preparingAt} />
              <TimelineRow label="Ready" at={order.readyAt} />
              <TimelineRow label="Shipped" at={order.shippedAt} />
              <TimelineRow label="Delivered" at={order.deliveredAt} />
              <TimelineRow label="Cancelled" at={order.cancelledAt} />
            </ul>
          </div>
        </section>

        {/* Status actions + internal notes */}
        <aside>
          <PastryOrderActions
            reference={order.reference}
            status={order.status}
            internalNotes={order.internalNotes}
          />
        </aside>
      </div>
    </>
  );
}

function TimelineRow({ label, at }: { label: string; at: string | null }) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-neutral-700">{label}</span>
      <span className="text-neutral-500">
        {at ? new Date(at).toLocaleString() : "—"}
      </span>
    </li>
  );
}
