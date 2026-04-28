import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Audit log",
  robots: { index: false, follow: false },
};

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: { email: string; name: string; role: string } | null;
}

interface ListResponse {
  rows: AuditRow[];
  total: number;
  limit: number;
  offset: number;
}

function actionVariant(action: string): "orange" | "neutral" | "success" | "maroon" {
  if (action.includes("publish") || action.includes("login.success") || action.includes("verify-email.success")) {
    return "success";
  }
  if (
    action.includes("delete") ||
    action.includes("reuse") ||
    action.includes("locked") ||
    action.includes("cancel")
  ) {
    return "maroon";
  }
  if (action.startsWith("auth.")) return "orange";
  return "neutral";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { action?: string; entity?: string; page?: string };
}) {
  const cookieHeader = (await cookies()).toString();

  const limit = 50;
  const offset = (Number(searchParams.page ?? "1") - 1) * limit;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  if (searchParams.action) qs.set("action", searchParams.action);
  if (searchParams.entity) qs.set("entity", searchParams.entity);

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/audit/logs?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load audit log.";
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <>
      <p className="eyebrow mb-2">Admin</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">Audit log</h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Append-only record of every admin and security event. Useful for incident response, dispute
        resolution, and the occasional &ldquo;who changed that hero text?&rdquo;
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-4" method="get">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Action prefix
          <input
            name="action"
            defaultValue={searchParams.action ?? ""}
            placeholder="e.g. content. or auth."
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Entity
          <input
            name="entity"
            defaultValue={searchParams.entity ?? ""}
            placeholder="e.g. ContentBlock, GiftOrder"
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
          <p className="m-0 font-sans text-base text-neutral-700">No matching audit events.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((r) => (
                <tr key={r.id} className="border-t border-cream-200">
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Tag variant={actionVariant(r.action)}>{r.action}</Tag>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.entity}
                    {r.entityId ? (
                      <div className="font-mono text-xs text-neutral-500">{r.entityId}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-neutral-800">
                    {r.actor ? (
                      <>
                        <div>{r.actor.name}</div>
                        <div className="text-xs text-neutral-500">
                          {r.actor.email} · {r.actor.role.toLowerCase()}
                        </div>
                      </>
                    ) : (
                      <span className="text-neutral-500">system</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{r.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > limit ? (
        <div className="mt-6 flex items-center justify-between font-sans text-sm text-neutral-700">
          <span>
            Page {currentPage} of {totalPages} · {data.total.toLocaleString()} events
          </span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(searchParams, currentPage - 1)}
                className="border border-cream-200 px-3 py-1.5 hover:bg-cream-100"
              >
                ← Newer
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(searchParams, currentPage + 1)}
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

function pageHref(
  current: { action?: string; entity?: string },
  page: number,
): string {
  const qs = new URLSearchParams();
  if (current.action) qs.set("action", current.action);
  if (current.entity) qs.set("entity", current.entity);
  qs.set("page", String(page));
  return `/admin/audit?${qs.toString()}`;
}
