import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Cravings subscribers",
  robots: { index: false, follow: false },
};

interface SubscriberRow {
  id: string;
  status: string;
  monthlyAmountMinor: number;
  currency: string;
  balanceMinor: number;
  currentPeriodEnd: string | null;
  user: { email: string; name: string } | null;
  plan: { name: string } | null;
}

interface ListResponse {
  rows: SubscriberRow[];
  total: number;
}

const STATUS_VARIANT: Record<string, "orange" | "neutral" | "success" | "maroon"> = {
  PENDING: "orange",
  ACTIVE: "success",
  PAUSED: "neutral",
  PAST_DUE: "maroon",
  CANCELLED: "maroon",
  ENDED: "maroon",
};

export default async function AdminCravingsPage() {
  const cookieHeader = (await cookies()).toString();

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>("/admin/cravings/subscribers", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load subscribers.";
  }

  const fmt = (minor: number, currency: string) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(
      minor / 100,
    );

  return (
    <>
      <p className="eyebrow mb-2">Admin · Cravings</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Cravings subscribers
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Stripe is the source of truth for subscription state. This list mirrors the latest webhook
        sync. Plan management (price changes, pausing all subscribers) is intentionally limited —
        do that through Stripe directly.
      </p>

      {error ? (
        <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p>
      ) : null}

      {!data || data.rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">No subscribers yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Monthly</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Renews</th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((s) => (
                <tr key={s.id} className="border-t border-cream-200">
                  <td className="px-4 py-3 text-neutral-800">
                    <div>{s.user?.name ?? "—"}</div>
                    <div className="text-xs text-neutral-500">{s.user?.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{s.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Tag variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status.toLowerCase()}</Tag>
                  </td>
                  <td className="px-4 py-3 text-neutral-800">
                    {fmt(s.monthlyAmountMinor, s.currency)}
                  </td>
                  <td className="px-4 py-3 font-display text-base text-maroon-600">
                    {fmt(s.balanceMinor, s.currency)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {s.currentPeriodEnd
                      ? new Date(s.currentPeriodEnd).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 max-w-prose font-sans text-sm text-neutral-500">
        Plans are managed via API (`POST /api/v1/admin/cravings/plans`) and Stripe. A simple plan
        editor UI lands in Phase 7 polish.
      </p>
    </>
  );
}
