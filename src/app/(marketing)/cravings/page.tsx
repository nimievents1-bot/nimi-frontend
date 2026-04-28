import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { apiFetch } from "@/lib/api";
import { images } from "@/lib/images";

import { PlanGrid } from "./PlanGrid";

export const metadata: Metadata = {
  title: "Pastry Cravings",
  description:
    "A monthly pastry subscription with rolling credit. Set an amount, build credit, redeem when you crave it.",
};

interface PublicPlan {
  slug: string;
  name: string;
  description: string | null;
  monthlyAmountMinor: number;
  currency: string;
  position: number;
}

const FALLBACK_PLANS: PublicPlan[] = [
  {
    slug: "cravings-25",
    name: "£25 / month",
    description: "A weekly treat. Roll-over keeps it gentle.",
    monthlyAmountMinor: 2500,
    currency: "gbp",
    position: 1,
  },
  {
    slug: "cravings-50",
    name: "£50 / month",
    description: "The sweet spot for households and small offices.",
    monthlyAmountMinor: 5000,
    currency: "gbp",
    position: 2,
  },
  {
    slug: "cravings-100",
    name: "£100 / month",
    description: "For frequent celebrations and bigger teams.",
    monthlyAmountMinor: 10000,
    currency: "gbp",
    position: 3,
  },
];

export default async function CravingsPage() {
  let plans: PublicPlan[] = [];
  try {
    plans = await apiFetch<PublicPlan[]>("/cravings/plans", {
      method: "GET",
      next: { revalidate: 60, tags: ["cravings-plans"] },
      throwOnError: true,
    });
    if (plans.length === 0) plans = FALLBACK_PLANS;
  } catch {
    plans = FALLBACK_PLANS;
  }

  return (
    <>
      <Hero
        height="short"
        eyebrow="Pastry Cravings"
        title="A small, monthly indulgence."
        lede="Set a budget. Build credit. Redeem when the moment is right."
        imageUrl={images.hero.cravings}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Subscribe once, indulge whenever.
          </h2>
          <ol className="mb-12 max-w-prose list-decimal pl-6 font-sans text-base leading-relaxed text-neutral-700">
            <li className="mb-2">Pick a plan and we set up a monthly subscription with Stripe.</li>
            <li className="mb-2">Each month, that amount is added to your Cravings credit.</li>
            <li className="mb-2">Unused credit rolls over (up to a £1,000 cap).</li>
            <li className="mb-2">Redeem your credit on pastry orders, any time.</li>
            <li className="mb-2">Pause for up to 3 months whenever life gets busy, or cancel any time.</li>
          </ol>

          <PlanGrid plans={plans} />

          <p className="mt-8 max-w-prose font-sans text-sm text-neutral-500">
            Subscriptions are processed by Stripe. You can pause, change plan or cancel any time
            through your account.
          </p>
        </div>
      </section>
    </>
  );
}
