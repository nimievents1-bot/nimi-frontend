import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Pastry menu",
  robots: { index: false, follow: false },
};

interface PastryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  tags: string[] | unknown;
  batchLimit: number | null;
  leadTimeDays: number;
  displayOrder: number;
  available: boolean;
  updatedAt: string;
}

interface ListResponse {
  rows: PastryRow[];
  total: number;
}

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ available?: string; q?: string }>;
}) {
  const { available, q } = await searchParams;
  const cookieHeader = (await cookies()).toString();

  const qs = new URLSearchParams();
  if (available === "true") qs.set("available", "true");
  if (available === "false") qs.set("available", "false");
  if (q) qs.set("q", q);
  qs.set("limit", "200");

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/pastries?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load pastries.";
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Admin · Menu</p>
          <h1 className="m-0 mb-2 font-display text-5xl font-medium text-maroon-600">
            Pastry menu
          </h1>
          <p className="m-0 max-w-prose font-sans text-base text-neutral-700">
            The menu customers see on{" "}
            <Link
              href="/cravings"
              className="text-orange-700 underline underline-offset-4"
            >
              /cravings
            </Link>{" "}
            and order from. Only items with{" "}
            <Tag variant="success">available</Tag> show publicly. Lower display-order
            numbers appear first.
          </p>
        </div>
        <Link
          href="/admin/menu/new"
          className="inline-flex items-center justify-center bg-orange-600 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-cream-50 hover:bg-orange-700"
        >
          New item
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-4" method="get">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Status
          <select
            name="available"
            defaultValue={available ?? ""}
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          >
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Hidden</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Search
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, slug or description"
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
            No items yet. Click <strong>New item</strong> to add the first pastry.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Lead time</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-cream-200">
                  <td className="px-4 py-3">
                    <div className="font-display text-base text-maroon-600">{row.name}</div>
                    <div className="text-xs text-neutral-500">/{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Tag variant={row.available ? "success" : "orange"}>
                      {row.available ? "available" : "hidden"}
                    </Tag>
                  </td>
                  <td className="px-4 py-3 font-display text-base text-orange-700">
                    {fmtGBP(row.priceMinor, row.currency)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row.leadTimeDays === 0
                      ? "Same day"
                      : `${row.leadTimeDays} day${row.leadTimeDays === 1 ? "" : "s"}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{row.displayOrder}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(row.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/menu/${row.id}`}
                      className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 underline underline-offset-4"
                    >
                      Edit
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
