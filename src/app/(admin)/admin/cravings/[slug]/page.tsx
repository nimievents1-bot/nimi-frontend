import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { ApiError, apiFetch } from "@/lib/api";

import { type ExistingPlan, PlanEditor } from "../PlanEditor";

export const metadata: Metadata = {
  title: "Admin · Edit tier",
  robots: { index: false, follow: false },
};

/**
 * Edit an existing Indulgence Club tier. The slug is read-only — it
 * gets stamped into Stripe metadata and renaming would orphan webhooks
 * + leave existing subscriptions pointing at a tier slug we no longer
 * recognise.
 *
 * Distinguishes a real 404 (slug doesn't exist) from a transient API
 * failure (rendering an Alert in that case rather than a misleading
 * "not found"), so a Railway hiccup doesn't look like a missing tier.
 */
export default async function EditCravingsPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieHeader = (await cookies()).toString();

  let plan: ExistingPlan | null = null;
  let loadError: string | null = null;

  try {
    plan = await apiFetch<ExistingPlan>(`/admin/cravings/plans/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    loadError = err instanceof Error ? err.message : "Couldn't load this tier.";
  }

  return (
    <>
      <p className="eyebrow mb-2">
        <Link href="/admin/cravings" className="text-orange-700 underline underline-offset-4">
          Indulgence Club
        </Link>{" "}
        · Edit tier
      </p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        {plan ? plan.name : "Edit tier"}
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Update the public name, description, price, or sort order. Existing subscribers stay on
        their current Stripe Price; new subscribers from this point on get whatever you save here.
      </p>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {plan ? <PlanEditor existing={plan} /> : null}
    </>
  );
}
