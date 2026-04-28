import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Gift orders",
  robots: { index: false, follow: false },
};

interface OrderRow {
  id: string;
  reference: string;
  status: string;
  name: string;
  email: string;
  totalMinor: number;
  currency: string;
  createdAt: string;
  items: Array<{ quantity: number; collectionSnapshot: { name: string } }>;
}

interface ListResponse {
  rows: OrderRow[];
  total: number;
  limit: number;
  offset: number;
}

const STATUSES = [
  "PENDING_PAYMENT",
  "AWAITING_DESIGN_APPROVAL",
  "DESIGN_SENT",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

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

export default async function AdminOrdersList({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const cookieHeader = (await cookies()).toString();
  const limit = 25;
  const offset = (Number(searchParams.page ?? "1") - 1) * limit;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.q) qs.set("q", searchParams.q);

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/gifting/orders?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load orders.";
  }

  return (
    <>
      <p className="eyebrow mb-2">Admin · Orders</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">Gift orders</h1>

      <form className="mb-6 flex flex-wrap items-end gap-4" method="get">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Status
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Search
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Reference, name, email…"
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          />
        </label>
        <button
          type="submit"
          className="bg-maroon-600 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream-50 hover:bg-maroon-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p> : null}

      {!data || data.rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">No orders match those filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((o) => {
                const fmt = new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: o.currency.toUpperCase(),
                });
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
                    <td className="px-4 py-3 text-neutral-800">
                      <div>{o.name}</div>
                      <div className="text-xs text-neutral-500">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {o.items.map((i) => `${i.quantity} × ${i.collectionSnapshot.name}`).join("; ")}
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                      {fmt.format(o.totalMinor / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 underline underline-offset-4"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > limit ? (
        <div className="mt-6 font-sans text-sm text-neutral-700">
          {data.total} orders
        </div>
      ) : null}
    </>
  );
}
