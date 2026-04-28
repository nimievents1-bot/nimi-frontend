import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Enquiries",
  robots: { index: false, follow: false },
};

interface EnquiryRow {
  id: string;
  kind: string;
  status: "NEW" | "CONTACTED" | "CLOSED" | "SPAM";
  name: string;
  email: string;
  phone: string | null;
  eventDate: string | null;
  notes: string;
  createdAt: string;
}

interface ListResponse {
  rows: EnquiryRow[];
  total: number;
  limit: number;
  offset: number;
}

const STATUSES = ["NEW", "CONTACTED", "CLOSED", "SPAM"] as const;
const KINDS = ["GENERAL", "CATERING", "EVENTS", "GIFTING", "CRAVINGS", "PRESS"] as const;

const statusVariant: Record<EnquiryRow["status"], "orange" | "neutral" | "success" | "maroon"> = {
  NEW: "orange",
  CONTACTED: "neutral",
  CLOSED: "success",
  SPAM: "maroon",
};

export default async function AdminEnquiriesList({
  searchParams,
}: {
  searchParams: { status?: string; kind?: string; q?: string; page?: string };
}) {
  const cookieHeader = (await cookies()).toString();
  const limit = 25;
  const offset = (Number(searchParams.page ?? "1") - 1) * limit;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.kind) qs.set("kind", searchParams.kind);
  if (searchParams.q) qs.set("q", searchParams.q);

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/enquiries?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load enquiries.";
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <>
      <p className="eyebrow mb-2">Admin · Enquiries</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Enquiries inbox
      </h1>

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
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Kind
          <select
            name="kind"
            defaultValue={searchParams.kind ?? ""}
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          >
            <option value="">All</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Search
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Name, email, body…"
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

      {error ? (
        <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p>
      ) : null}

      {!data || data.rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">
            No enquiries match those filters yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Event date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((row) => (
                <tr key={row.id} className="border-t border-cream-200 hover:bg-cream-50">
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Tag variant={statusVariant[row.status]}>{row.status}</Tag>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{row.kind}</td>
                  <td className="px-4 py-3 text-neutral-800">{row.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{row.email}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row.eventDate ? new Date(row.eventDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/enquiries/${row.id}`}
                      className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 underline underline-offset-4 hover:text-orange-700"
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

      {data && data.total > limit ? (
        <div className="mt-6 flex items-center justify-between font-sans text-sm text-neutral-700">
          <span>
            Page {currentPage} of {totalPages} · {data.total} enquiries
          </span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/admin/enquiries?${prevPageQuery(searchParams, currentPage - 1)}`}
                className="border border-cream-200 px-3 py-1.5 hover:bg-cream-100"
              >
                ← Newer
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={`/admin/enquiries?${prevPageQuery(searchParams, currentPage + 1)}`}
                className="border border-cream-200 px-3 py-1.5 hover:bg-cream-100"
              >
                Older →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function prevPageQuery(
  current: { status?: string; kind?: string; q?: string },
  page: number,
): string {
  const qs = new URLSearchParams();
  if (current.status) qs.set("status", current.status);
  if (current.kind) qs.set("kind", current.kind);
  if (current.q) qs.set("q", current.q);
  qs.set("page", String(page));
  return qs.toString();
}
