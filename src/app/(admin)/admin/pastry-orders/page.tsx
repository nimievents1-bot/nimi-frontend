import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Pastry orders",
  robots: { index: false, follow: false },
};

interface PastryOrderRow {
  id: string;
  reference: string;
  status: string;
  name: string;
  email: string;
  totalMinor: number;
  subtotalMinor: number;
  creditAppliedMinor: number;
  currency: string;
  shippingCity: string;
  shippingPostcode: string;
  createdAt: string;
  paidAt: string | null;
  _count: { items: number };
}

interface ListResponse {
  rows: PastryOrderRow[];
  total: number;
}

const STATUS_VARIANT: Record<string, "orange" | "neutral" | "success" | "maroon"> = {
  PENDING_PAYMENT: "orange",
  PAID: "success",
  PREPARING: "neutral",
  READY: "neutral",
  SHIPPED: "neutral",
  DELIVERED: "success",
  CANCELLED: "maroon",
  REFUNDED: "maroon",
};

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "PENDING_PAYMENT", label: "Pending payment" },
  { value: "PAID", label: "Paid" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
] as const;

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function AdminPastryOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const cookieHeader = (await cookies()).toString();

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (q) qs.set("q", q);
  qs.set("limit", "100");

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/pastry-orders?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load pastry orders.";
  }

  return (
    <>
      <p className="eyebrow mb-2">Admin · Operations</p>
      <h1 className="m-0 mb-2 font-display text-5xl font-medium text-maroon-600">
        Pastry orders
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Live queue for the kitchen. Move orders through{" "}
        <strong>Paid → Preparing → Ready → Shipped → Delivered</strong>; the customer
        is emailed at every customer-facing step.
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-4" method="get">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Search
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Reference, customer name or email"
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
          <p className="m-0 font-sans text-base text-neutral-700">
            No pastry orders match this filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-cream-200">
                  <td className="px-4 py-3 font-mono text-neutral-700">{row.reference}</td>
                  <td className="px-4 py-3">
                    <div className="font-sans text-sm font-medium text-neutral-900">
                      {row.name}
                    </div>
                    <div className="font-sans text-xs text-neutral-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row.shippingCity} · {row.shippingPostcode}
                  </td>
                  <td className="px-4 py-3">
                    <Tag variant={STATUS_VARIANT[row.status] ?? "neutral"}>
                      {row.status.replace(/_/g, " ").toLowerCase()}
                    </Tag>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row._count.items}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                    {fmt(row.totalMinor, row.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pastry-orders/${row.reference}`}
                      className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 underline underline-offset-4"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
