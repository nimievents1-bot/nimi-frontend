import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { heroBackground, images } from "@/lib/images";

import { AddToCartButton } from "./AddToCartButton";
import { PlanGrid } from "./PlanGrid";
import { TruncatedDescription } from "./TruncatedDescription";

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
  /**
   * False when the plan exists in the DB but doesn't yet have a Stripe
   * Price ID. The grid renders these as disabled "Coming soon" cards
   * rather than clickable "Join the club" CTAs — otherwise the API
   * would 503 on subscribe and a customer would think the club is
   * broken. Server seeds tiers without Stripe wiring; the admin
   * publishes via the upsert endpoint to flip this true.
   */
  stripeReady?: boolean;
}

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

  // Plans live in the database — the API seeds three defaults on first
  // boot. We deliberately do NOT fall back to a hardcoded set when the
  // fetch fails or returns empty: doing so used to surface clickable
  // tiers whose slugs didn't exist server-side, producing a "Not Found"
  // error on Join. An honest empty state ("Coming soon") is much better
  // than a button that 404s.
  let plans: PublicPlan[] = [];
  try {
    plans = await apiFetch<PublicPlan[]>("/cravings/plans", {
      method: "GET",
      next: { revalidate: 60, tags: ["cravings-plans"] },
      throwOnError: true,
    });
  } catch {
    // Leaves `plans` empty — the PlanGrid renders the empty-state copy.
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
              {/*
                Two layouts depending on viewport. Earlier we had a single
                overlay-style design at every breakpoint — on phones the
                description got rendered ON TOP of the image inside a
                gradient and bled into the lighter half of the image,
                leaving it unreadable. The split below keeps the
                editorial overlay design on desktop (which has room for
                the gradient to do its job) and switches to a stacked
                photo-then-text layout on mobile where text always sits
                on the cream surface in its own space.
              */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {pastries.map((item) => {
                  const isLimited =
                    Array.isArray(item.tags) && item.tags.includes("limited");
                  return (
                    <article
                      key={item.id}
                      className="group relative overflow-hidden border border-cream-200 bg-cream-50"
                    >
                      <div className="relative">
                        <div
                          role="img"
                          aria-label={
                            item.imageAlt ?? `${item.name} — ${item.description ?? ""}`
                          }
                          className="aspect-[4/3] w-full bg-gradient-to-br from-orange-200 to-maroon-700 transition-transform duration-base ease-brand sm:aspect-square sm:group-hover:scale-105"
                          style={
                            item.imageUrl
                              ? heroBackground(item.imageUrl)
                              : { background: "linear-gradient(135deg,#ECA068,#5C1F18)" }
                          }
                        />

                        {/* Top-right: add-to-cart trigger. Floats over
                            the image on every breakpoint — the pill has
                            its own contrast surface so it stays legible
                            even on dark photography. */}
                        <AddToCartButton
                          pastryItemId={item.id}
                          itemName={item.name}
                          isAuthed={isAuthed}
                          slug={item.slug}
                          description={item.description ?? null}
                          imageUrl={item.imageUrl ?? null}
                          unitPriceMinor={item.priceMinor}
                          currency={item.currency}
                        />

                        {/* Desktop-only editorial overlay. Hidden on
                            phones because the description gets a real
                            text block below the image instead. */}
                        <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-maroon-700/95 via-maroon-700/60 to-transparent p-4 pt-10 sm:block">
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
                      </div>

                      {/* Mobile-only text block. Lives BELOW the image
                          on the cream card surface so the description
                          has proper contrast and breathing room. Hidden
                          at sm+ where the overlay above takes over.

                          Layout brief from the operator: the NAME should
                          lead — bold, large, immediately readable. The
                          description is collapsed to a teaser with a
                          tappable "…" the customer can press to read
                          the full copy (handled by TruncatedDescription).
                          This keeps the card scannable without
                          sacrificing the marketing copy. */}
                      <div className="block px-4 py-4 sm:hidden">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="m-0 font-display text-2xl font-semibold text-maroon-700">
                            {item.name}
                          </h3>
                          <span className="font-display text-lg font-medium text-orange-700">
                            {fmtGBP(item.priceMinor, item.currency)}
                          </span>
                        </div>
                        {item.description ? (
                          <TruncatedDescription text={item.description} />
                        ) : null}
                      </div>
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
