import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

interface CustomerOrder {
  id: string;
  reference: string;
  status: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: Array<{ quantity: number; collectionSnapshot: { name: string } }>;
}

const STATUS_VARIANT: Record<string, "orange" | "neutral" | "success" | "maroon"> = {
  PENDING_PAYMENT: "orange",
  AWAITING_DESIGN_APPROVAL: "orange",
  DESIGN_SENT: "neutral",
  IN_PRODUCTION: "neutral",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "maroon",
  REFUNDED: "maroon",
};

export default async function CustomerOrdersPage() {
  const cookieHeader = (await cookies()).toString();
  let orders: CustomerOrder[] = [];
  try {
    orders = await apiFetch<CustomerOrder[]>("/gifting/orders/me", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    orders = [];
  }

  return (
    <>
      <p className="eyebrow mb-2">Your account</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Orders &amp; gifts
      </h1>

      {orders.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">
            No gift orders yet. Browse the{" "}
            <a className="text-orange-600 underline underline-offset-4" href="/gifting">
              gift collections
            </a>{" "}
            to get started.
          </p>
        </div>
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
              {orders.map((o) => {
                const fmt = new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: o.currency.toUpperCase(),
                });
                const itemsLabel = o.items
                  .map((i) => `${i.quantity} × ${i.collectionSnapshot.name}`)
                  .join("; ");
                return (
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
                    <td className="px-4 py-3 text-neutral-800">{itemsLabel}</td>
                    <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                      {fmt.format(o.totalMinor / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 max-w-prose font-sans text-sm text-neutral-500">
        Order detail pages with the design-approval flow land in Phase 4.1.
      </p>
    </>
  );
}
