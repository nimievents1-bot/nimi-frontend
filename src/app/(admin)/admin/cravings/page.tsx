import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

import { PlanPublishButton } from "./PlanPublishButton";

export const metadata: Metadata = {
  title: "Admin · Indulgence Club subscribers",
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

interface AdminPlanRow {
  slug: string;
  name: string;
  description: string | null;
  monthlyAmountMinor: number;
  currency: string;
  position: number;
  active: boolean;
  stripeReady: boolean;
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

  // Fetch plans + subscribers in parallel. Either may fail independently
  // (e.g. an empty subscribers list is normal at launch, but the plans
  // section is what the admin uses to publish tiers to Stripe before
  // accepting their first subscriber).
  const [plansResult, subsResult] = await Promise.allSettled([
    apiFetch<AdminPlanRow[]>("/admin/cravings/plans", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
    apiFetch<ListResponse>("/admin/cravings/subscribers", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const plans: AdminPlanRow[] | null =
    plansResult.status === "fulfilled" ? plansResult.value : null;
  const data: ListResponse | null = subsResult.status === "fulfilled" ? subsResult.value : null;
  const error: string | null =
    subsResult.status === "rejected"
      ? subsResult.reason instanceof Error
        ? subsResult.reason.message
        : "Failed to load subscribers."
      : null;

  const fmt = (minor: number, currency: string) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(
      minor / 100,
    );

  return (
    <>
      <p className="eyebrow mb-2">Admin · Indulgence Club</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Indulgence Club subscribers
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Stripe is the source of truth for subscription state. This list mirrors the latest webhook
        sync. Plan management (price changes, pausing all subscribers) is intentionally limited —
        do that through Stripe directly.
      </p>

      {/* ---------- Plans panel ---------- */}
      <section className="mb-10">
        <h2 className="m-0 mb-2 font-display text-2xl text-maroon-600">Tiers</h2>
        <p className="mb-4 max-w-prose font-sans text-sm text-neutral-700">
          The three default tiers seed automatically on first boot. Each one needs to be published
          to Stripe before customers can subscribe — that step creates the Stripe Product and Price
          and wires it back to the plan row. You can re-publish at any time to push price or name
          changes through.
        </p>

        {!plans || plans.length === 0 ? (
          <div className="border border-dashed border-cream-200 bg-paper p-6 text-center">
            <p className="m-0 font-sans text-sm text-neutral-700">
              No tiers found yet. The API seeds defaults on first boot — restart the service if
              they don&rsquo;t appear within a few minutes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-cream-200 bg-paper">
            <table className="w-full border-collapse text-left">
              <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
                <tr>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Stripe</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="font-sans text-sm">
                {plans.map((p) => (
                  <tr key={p.slug} className="border-t border-cream-200">
                    <td className="px-4 py-3">
                      <div className="font-display text-base text-maroon-600">{p.name}</div>
                      <div className="text-xs text-neutral-500">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 font-display text-base text-orange-700">
                      {fmt(p.monthlyAmountMinor, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Tag variant={p.active ? "success" : "neutral"}>
                        {p.active ? "active" : "hidden"}
                      </Tag>
                    </td>
                    <td className="px-4 py-3">
                      <Tag variant={p.stripeReady ? "success" : "orange"}>
                        {p.stripeReady ? "ready" : "needs publishing"}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.stripeReady ? (
                        <span className="font-sans text-xs text-neutral-500">—</span>
                      ) : (
                        <PlanPublishButton
                          slug={p.slug}
                          name={p.name}
                          description={p.description}
                          monthlyAmountMinor={p.monthlyAmountMinor}
                          currency={p.currency}
                          position={p.position}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Subscribers panel ---------- */}
      <h2 className="m-0 mb-2 font-display text-2xl text-maroon-600">Subscribers</h2>

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
        For deeper plan changes — renaming a tier permanently, retiring a price, or pausing every
        subscriber at once — operate on the Stripe dashboard directly. Webhooks will reconcile the
        state on this page within seconds.
      </p>
    </>
  );
}
