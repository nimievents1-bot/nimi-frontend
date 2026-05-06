import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { heroBackground, images } from "@/lib/images";

import { AddToCartButton } from "./AddToCartButton";
import { PlanGrid } from "./PlanGrid";

/**
 * Public pastry shape returned by `/v1/pastries`. Mirrors the API DTO.
 * Field names align with PastriesService.listAvailable so this type
 * doubles as the fallback row's contract.
 */
interface PublicPastry {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  tags: string[];
  leadTimeDays: number;
}

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export const metadata: Metadata = {
  title: "The Nimi Indulgence Club",
  description:
    "Set aside a monthly indulgence allowance that turns into curated pastries. Priority access, exclusive drops, and surprise perks — instead of last-minute spending.",
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
    description: "A weekly treat — perfect for individuals.",
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

const benefits: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: "Monthly Indulgence Credits",
    description:
      "Your subscription is converted into monthly pastry credits — use them whenever you want within the validity period. No pressure to spend all at once.",
  },
  {
    title: "Priority Ordering",
    description:
      "Subscribers get first access to limited-batch pastries, priority during busy periods, and early access before general release.",
  },
  {
    title: "Surprise Monthly Gift",
    description:
      "Each month includes a small surprise pastry or treat — our way of saying thank you for being part of the club.",
  },
  {
    title: "Exclusive Menu Access",
    description:
      "Experimental and limited recipes before public launch, plus early tasting of new products before they reach the public menu.",
  },
  {
    title: "Flexible Indulgence Planning",
    description:
      "Helps you budget your treats monthly instead of impulse buying. Credits roll within their validity period — you decide when to indulge.",
  },
  {
    title: "Member Appreciation Perks",
    description:
      "Birthday treats, priority invitations to pop-ups and tastings, and surprise upgrades when ordering. The little things, made personal.",
  },
];

export default async function IndulgenceClubPage() {
  // Reading the session here is server-side and quick (single API call
  // with cookie forwarding); fine to do on a public page because the
  // helper returns null for unauthenticated visitors.
  const user = await getSessionUser();
  const isAuthed = Boolean(user);

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

  // Live pastry catalog from the admin-managed menu. The customer-facing
  // page used to render a curated placeholder set when the API returned
  // zero items, but admin can now publish the catalog themselves — so an
  // empty state ("Menu coming soon") is the right behaviour, not fake
  // data. Errors fall back to empty as well; the page never crashes.
  let pastries: PublicPastry[] = [];
  try {
    const response = await apiFetch<{ rows: PublicPastry[]; total: number }>(
      "/pastries?limit=24",
      {
        method: "GET",
        next: { revalidate: 60, tags: ["pastries"] },
        throwOnError: true,
      },
    );
    pastries = response.rows;
  } catch {
    // Silent fall-through to empty state.
  }

  return (
    <>
      <Hero
        height="short"
        eyebrow="The Nimi Indulgence Club"
        title="Plan your indulgence."
        lede="For the moments you know you'll want something sweet or savoury — but planned in advance."
        imageUrl={images.hero.cravings}
      />

      {/* Purpose section — sets the emotional + functional pitch. */}
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
            <div>
              <p className="eyebrow mb-3">The purpose</p>
              <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
                Cravings, planned with care.
              </h2>
              <p className="mb-4 max-w-prose font-sans text-lg text-neutral-700">
                The Indulgence Club exists for the moments you know you'll want something sweet or
                savoury — but planned in advance. Instead of impulsive spending, you set aside a
                monthly indulgence allowance that turns into curated pastries, made fresh by Nimi
                Events.
              </p>
              <p className="mb-4 max-w-prose font-sans text-lg text-neutral-700">
                The purpose is simple: to help you plan and enjoy regular, intentional indulgence
                without last-minute spending, stress, or missing out on limited drops. It turns your
                cravings into a structured monthly experience with added benefits and priority
                access.
              </p>
            </div>

            <aside className="border border-cream-200 bg-cream-100 p-6">
              <p className="eyebrow mb-3">Membership at a glance</p>
              <ul className="m-0 list-none space-y-3 p-0 font-sans text-sm text-neutral-800">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-orange-600" />
                  <span><strong>3-month minimum.</strong> The club is designed for ongoing indulgence, not one-off spending.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-orange-600" />
                  <span><strong>Credits valid 3 months.</strong> Each month's allowance has time to be used — but not forever.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-orange-600" />
                  <span><strong>Minimum order £25.</strong> Pastry orders start at £25 and use accumulated credits.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-orange-600" />
                  <span><strong>No refunds.</strong> Credits are prepaid value; cancellation stops future billing only.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-orange-600" />
                  <span><strong>Cancel anytime after the minimum term.</strong> Future billing stops; existing credits stay valid through their period.</span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Plans + checkout */}
      <section className="bg-cream-100 px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">Choose your indulgence</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Pick the rhythm that fits you.
          </h2>
          <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
            Three monthly tiers — each becomes Indulgence Credits ready to spend on freshly made
            pastries. Custom plans available on request.
          </p>

          <PlanGrid plans={plans} />

          <p className="mt-8 max-w-prose font-sans text-sm text-neutral-500">
            Subscriptions are processed by Stripe. After your three-month minimum, you can cancel
            any time from your account; future billing stops, and existing credits remain valid
            through their three-month period.
          </p>
        </div>
      </section>

      {/* Pastry gallery — what credits buy. */}
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">What you'll be ordering</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Made fresh, served warm.
          </h2>
          <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
            Indulgence Credits redeem against the Nimi pastry menu — small batches, made fresh,
            ready to collect or dispatched cold-chain. Minimum order £25 per drop.
          </p>

          {pastries.length === 0 ? (
            <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
              <p className="m-0 font-sans text-base text-neutral-700">
                Menu coming soon. Check back shortly — fresh items drop regularly.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                {pastries.map((item) => {
                  const isLimited =
                    Array.isArray(item.tags) && item.tags.includes("limited");
                  return (
                    <article
                      key={item.id}
                      className="group relative overflow-hidden border border-cream-200 bg-cream-50"
                    >
                      <div
                        role="img"
                        aria-label={
                          item.imageAlt ?? `${item.name} — ${item.description ?? ""}`
                        }
                        className="aspect-square w-full bg-gradient-to-br from-orange-200 to-maroon-700 transition-transform duration-base ease-brand group-hover:scale-105"
                        style={
                          item.imageUrl
                            ? heroBackground(item.imageUrl)
                            : { background: "linear-gradient(135deg,#ECA068,#5C1F18)" }
                        }
                      />

                      {/* Top-right: add-to-cart trigger. Stays compact and
                          floats over the image so the price stays legible. */}
                      <AddToCartButton
                        pastryItemId={item.id}
                        itemName={item.name}
                        isAuthed={isAuthed}
                      />

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-maroon-700/95 via-maroon-700/60 to-transparent p-4 pt-10">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="m-0 font-display text-lg font-medium text-cream-50">
                            {item.name}
                          </h3>
                          <span className="font-display text-sm font-medium text-cream-50/90">
                            {fmtGBP(item.priceMinor, item.currency)}
                          </span>
                        </div>
                        {item.description ? (
                          <p className="m-0 font-sans text-xs text-cream-50/85">
                            {item.description}
                          </p>
                        ) : null}
                      </div>

                      {isLimited ? (
                        <span className="absolute left-3 top-3 rounded-pill bg-orange-500 px-2 py-1 font-sans text-2xs font-semibold uppercase tracking-wider text-cream-50">
                          Limited batch
                        </span>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <p className="mt-6 max-w-prose font-sans text-xs italic text-neutral-500">
                Menu availability rotates seasonally and based on batch capacity. Add
                items to your cart to apply Indulgence Credits at checkout.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Benefits grid */}
      <section className="bg-cream-100 px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">Why members stay</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Six reasons to indulge well.
          </h2>
          <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
            Membership is more than a discount or a deferred payment — it's structured access to
            curated pastries, exclusive drops, and the small thoughtful gestures that turn a
            transaction into a relationship.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <article
                key={b.title}
                className="border border-cream-200 bg-cream-50 p-6 transition-shadow hover:shadow-md"
              >
                <p className="eyebrow mb-3">Benefit {i + 1}</p>
                <h3 className="m-0 mb-3 font-display text-xl font-medium text-maroon-600">
                  {b.title}
                </h3>
                <p className="m-0 font-sans text-base text-neutral-700">{b.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency footnote — the "fine print" the user explicitly asked for. */}
      <section className="bg-maroon-700 px-page-gutter py-section-y text-cream-50">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3 text-cream-50/80">Transparency</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-3xl font-medium">
            How the club works, plainly.
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="m-0 mb-2 font-display text-xl font-medium">Credits are prepaid value</h3>
              <p className="m-0 font-sans text-base text-cream-50/85">
                Your monthly amount becomes pastry credit. It is not cashback, not refundable, and
                not redeemable for cash equivalent. Credits expire three months from issue.
              </p>
            </div>
            <div>
              <h3 className="m-0 mb-2 font-display text-xl font-medium">Surprises are perks, not guarantees</h3>
              <p className="m-0 font-sans text-base text-cream-50/85">
                Surprise pastries, bonus items, and birthday gestures are occasional perks —
                wonderful when they land, but never a contractual entitlement.
              </p>
            </div>
            <div>
              <h3 className="m-0 mb-2 font-display text-xl font-medium">Priority access is the value driver</h3>
              <p className="m-0 font-sans text-base text-cream-50/85">
                The point of membership is consistent, planned indulgence with first-look access to
                limited drops — not a discount on individual orders.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Tag variant="orange">3-month minimum commitment</Tag>
            <Tag>Credits valid 3 months</Tag>
            <Tag>£25 minimum pastry order</Tag>
            <Tag variant="orange">No refunds after payment</Tag>
          </div>
        </div>
      </section>
    </>
  );
}
