import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

interface GiftOrder {
  id: string;
  reference: string;
  status: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: Array<{ quantity: number; collectionSnapshot: { name: string } }>;
}

interface PastryOrderSummary {
  id: string;
  reference: string;
  status: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
  itemCount: number;
}

const STATUS_VARIANT: Record<string, "orange" | "neutral" | "success" | "maroon"> = {
  // Gift order statuses
  PENDING_PAYMENT: "orange",
  AWAITING_DESIGN_APPROVAL: "orange",
  DESIGN_SENT: "neutral",
  IN_PRODUCTION: "neutral",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "maroon",
  REFUNDED: "maroon",
  // Pastry order statuses (overlap with the above where applicable)
  PAID: "success",
  PREPARING: "neutral",
  READY: "neutral",
};

const fmt = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * One unified orders page. We fetch both lists in parallel and present
 * pastry orders + gift orders as separate sections — they're different
 * fulfilment flows and customers know to look at them separately.
 *
 * Empty states are handled per-section so you don't see a single
 * "no orders" message when one type exists but the other doesn't.
 */
export default async function CustomerOrdersPage() {
  const cookieHeader = (await cookies()).toString();

  const [pastryResult, giftResult] = await Promise.allSettled([
    apiFetch<PastryOrderSummary[]>("/pastry-orders/mine", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
    apiFetch<GiftOrder[]>("/gifting/orders/me", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const pastryOrders = pastryResult.status === "fulfilled" ? pastryResult.value : [];
  const giftOrders = giftResult.status === "fulfilled" ? giftResult.value : [];
  const everythingEmpty = pastryOrders.length === 0 && giftOrders.length === 0;

  return (
    <>
      <p className="eyebrow mb-2">Your account</p>
      <h1 className="m-0 mb-2 font-display text-5xl font-medium text-maroon-600">
        Orders
      </h1>
      <p className="mb-10 max-w-prose font-sans text-base text-neutral-700">
        Pastry orders from{" "}
        <Link href="/cravings" className="text-orange-700 underline underline-offset-4">
          The Indulgence Club
        </Link>{" "}
        and bespoke gifting orders, all in one place.
      </p>

      {everythingEmpty ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 mb-4 font-sans text-base text-neutral-700">
            No orders yet. Browse{" "}
            <Link className="text-orange-600 underline underline-offset-4" href="/cravings">
              the pastry menu
            </Link>{" "}
            or{" "}
            <Link className="text-orange-600 underline underline-offset-4" href="/gifting">
              gift collections
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pastry orders section */}
          <section>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="m-0 font-display text-2xl font-medium text-maroon-600">
                Pastry orders
              </h2>
              <Link
                href="/cravings"
                className="font-display text-sm italic text-orange-700 underline underline-offset-4 hover:text-orange-800"
              >
                Order again
              </Link>
            </div>
            {pastryOrders.length === 0 ? (
              <p className="border border-dashed border-cream-200 bg-paper p-6 font-sans text-sm text-neutral-700">
                No pastry orders yet.
              </p>
            ) : (
              <div className="overflow-x-auto border border-cream-200 bg-paper">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3 text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans text-sm">
                    {pastryOrders.map((o) => (
                      <tr key={o.id} className="border-t border-cream-200">
                        <td className="px-4 py-3">
                          <Link
                            href={`/account/orders/${o.reference}`}
                            className="font-mono text-neutral-700 underline underline-offset-4 hover:text-orange-700"
                          >
                            {o.reference}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Tag variant={STATUS_VARIANT[o.status] ?? "neutral"}>
                            {o.status.replace(/_/g, " ").toLowerCase()}
                          </Tag>
                        </td>
                        <td className="px-4 py-3 text-neutral-800">
                          {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                          {fmt(o.totalMinor, o.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Gift orders section */}
          <section>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="m-0 font-display text-2xl font-medium text-maroon-600">
                Gift orders
              </h2>
              <Link
                href="/gifting"
                className="font-display text-sm italic text-orange-700 underline underline-offset-4 hover:text-orange-800"
              >
                Order another
              </Link>
            </div>
            {giftOrders.length === 0 ? (
              <p className="border border-dashed border-cream-200 bg-paper p-6 font-sans text-sm text-neutral-700">
                No gift orders yet.
              </p>
            ) : (
              <div className="overflow-x-auto border border-cream-200 bg-paper">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans text-sm">
                    {giftOrders.map((o) => (
                      <tr key={o.id} className="border-t border-cream-200">
                        <td className="px-4 py-3 font-mono text-neutral-700">{o.reference}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Tag variant={STATUS_VARIANT[o.status] ?? "neutral"}>
                            {o.status.replace(/_/g, " ").toLowerCase()}
                          </Tag>
                        </td>
                        <td className="px-4 py-3 text-neutral-800">
                          {o.items
                            .map((i) => `${i.quantity} × ${i.collectionSnapshot.name}`)
                            .join("; ")}
                        </td>
                        <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                          {fmt(o.totalMinor, o.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
