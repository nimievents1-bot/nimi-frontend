import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

import { ManageSubscription } from "./ManageSubscription";

export const metadata: Metadata = {
  title: "The Indulgence Club — your subscription",
  robots: { index: false, follow: false },
};

interface SubscriptionState {
  subscription: {
    id: string;
    status: string;
    monthlyAmountMinor: number;
    currency: string;
    currentPeriodEnd: string | null;
    pausedUntil: string | null;
    cancelAt: string | null;
    creditExpiresAt: string | null;
  } | null;
  plan: { slug: string; name: string } | null;
  balanceMinor: number;
  creditCapMinor: number;
  recent: Array<{
    id: string;
    type: string;
    amountMinor: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
  }>;
}

const STATUS_VARIANT: Record<string, "orange" | "neutral" | "success" | "maroon"> = {
  PENDING: "orange",
  ACTIVE: "success",
  PAUSED: "neutral",
  PAST_DUE: "maroon",
  CANCELLED: "maroon",
  ENDED: "maroon",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const cookieHeader = (await cookies()).toString();

  let state: SubscriptionState | null = null;
  let error: string | null = null;
  try {
    state = await apiFetch<SubscriptionState>("/cravings/me", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load subscription.";
  }

  const fmt = (minor: number, currency = "gbp") =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(
      minor / 100,
    );

  return (
    <>
      <p className="eyebrow mb-2">Your account</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        The Indulgence Club
      </h1>

      {searchParams.status === "subscribed" ? (
        <Alert variant="success" className="mb-6">
          Welcome to The Nimi Indulgence Club — your first month&rsquo;s Indulgence Credits will
          land on your next billing cycle.
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      {!state || !state.subscription ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 mb-4 font-sans text-base text-neutral-700">
            You haven&rsquo;t joined The Indulgence Club yet.
          </p>
          <a
            href="/cravings"
            className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
          >
            Browse the plans
          </a>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <section className="border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
                Your plan
              </h2>
              <dl className="grid grid-cols-[160px_1fr] gap-y-3 font-sans text-base">
                <dt className="text-neutral-500">Plan</dt>
                <dd className="text-neutral-800">{state.plan?.name ?? "Custom"}</dd>
                <dt className="text-neutral-500">Status</dt>
                <dd>
                  <Tag variant={STATUS_VARIANT[state.subscription.status] ?? "neutral"}>
                    {state.subscription.status.toLowerCase()}
                  </Tag>
                </dd>
                <dt className="text-neutral-500">Monthly amount</dt>
                <dd className="text-neutral-800">
                  {fmt(state.subscription.monthlyAmountMinor, state.subscription.currency)}
                </dd>
                {state.subscription.currentPeriodEnd ? (
                  <>
                    <dt className="text-neutral-500">Renews</dt>
                    <dd className="text-neutral-800">
                      {new Date(state.subscription.currentPeriodEnd).toLocaleDateString()}
                    </dd>
                  </>
                ) : null}
                {state.subscription.pausedUntil ? (
                  <>
                    <dt className="text-neutral-500">Paused until</dt>
                    <dd className="text-neutral-800">
                      {new Date(state.subscription.pausedUntil).toLocaleDateString()}
                    </dd>
                  </>
                ) : null}
                {state.subscription.cancelAt ? (
                  <>
                    <dt className="text-neutral-500">Cancels on</dt>
                    <dd className="text-neutral-800">
                      {new Date(state.subscription.cancelAt).toLocaleDateString()}
                    </dd>
                  </>
                ) : null}
              </dl>

              <div className="mt-6">
                <ManageSubscription />
              </div>
            </section>

            <section className="border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
                Indulgence Credits
              </h2>
              <p className="m-0 mb-1 font-display text-4xl font-medium text-orange-700">
                {fmt(state.balanceMinor, state.subscription.currency)}
              </p>
              <p className="m-0 font-sans text-sm text-neutral-500">
                of {fmt(state.creditCapMinor, state.subscription.currency)} cap
              </p>
              {state.subscription.creditExpiresAt ? (
                <p className="mt-3 font-sans text-sm text-neutral-700">
                  Credits expire{" "}
                  <strong>
                    {new Date(state.subscription.creditExpiresAt).toLocaleDateString()}
                  </strong>
                  .
                </p>
              ) : (
                <p className="mt-3 font-sans text-sm text-neutral-500">
                  Each month&rsquo;s credits are valid for three months from issue. Minimum pastry
                  order: £25.
                </p>
              )}
            </section>
          </div>

          <section className="mt-10 border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
              Recent transactions
            </h2>
            {state.recent.length === 0 ? (
              <p className="m-0 font-sans text-base text-neutral-500">
                Nothing yet. Your first accrual lands on the next billing cycle.
              </p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead className="font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Balance after</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-sm">
                  {state.recent.map((tx) => (
                    <tr key={tx.id} className="border-t border-cream-200">
                      <td className="py-2 text-neutral-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-neutral-700">{tx.type.toLowerCase()}</td>
                      <td
                        className={`py-2 ${
                          tx.amountMinor >= 0 ? "text-semantic-success" : "text-semantic-danger"
                        }`}
                      >
                        {tx.amountMinor >= 0 ? "+" : ""}
                        {fmt(tx.amountMinor, state.subscription!.currency)}
                      </td>
                      <td className="py-2 text-right text-neutral-800">
                        {fmt(tx.balanceAfter, state.subscription!.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </>
  );
}
