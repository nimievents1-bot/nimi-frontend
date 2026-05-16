import { type Metadata } from "next";
import Link from "next/link";

import { PlanEditor } from "../PlanEditor";

export const metadata: Metadata = {
  title: "Admin · New tier",
  robots: { index: false, follow: false },
};

/**
 * Create a new Indulgence Club tier. Saves go through the same upsert
 * endpoint used for editing existing tiers. After save, the operator
 * lands back on the tiers list where they can click "Publish to Stripe"
 * to mint the Stripe Product + Price.
 */
export default function NewCravingsPlanPage() {
  return (
    <>
      <p className="eyebrow mb-2">
        <Link href="/admin/cravings" className="text-orange-700 underline underline-offset-4">
          Indulgence Club
        </Link>{" "}
        · New tier
      </p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Add a new tier
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        New tiers are saved hidden until you publish them to Stripe — that step creates the
        Stripe Product and Price so customers can subscribe. You can re-publish at any time to
        push name or price changes.
      </p>

      <PlanEditor />
    </>
  );
}
