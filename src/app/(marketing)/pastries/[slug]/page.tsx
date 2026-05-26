import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/app/(marketing)/cravings/AddToCartButton";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { heroBackground } from "@/lib/images";

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
  minQuantity: number;
  batchLimit: number | null;
}

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * Metadata is per-slug — give each pastry its own page title and
 * description for shareability + SEO. We fetch the row here and again
 * in the page; Next.js dedupes the underlying network request when
 * both calls happen in the same render cycle, so this isn't a doubled
 * round trip.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const item = await apiFetch<PublicPastry>(`/pastries/${slug}`, {
      method: "GET",
      cache: "no-store",
    });
    return {
      title: item.name,
      description: item.description ?? `${item.name} — from the Nimi pastry kitchen.`,
    };
  } catch {
    return { title: "Pastry" };
  }
}

/**
 * Public pastry detail page.
 *
 * Reached by clicking the title of any card on `/pastries` or
 * `/cravings`. Shows the full product description (not the
 * mobile-truncated teaser), a generous hero image, and the same
 * `AddToCartButton` the grid uses — so a customer can add this item
 * to their cart without bouncing back to the listing.
 *
 * Why a server component:
 *   - SEO. Each pastry gets a real shareable URL with its own
 *     metadata (title + description), so links from social/messengers
 *     unfurl properly.
 *   - Performance. The detail row is read from the public
 *     `/v1/pastries/:slug` endpoint server-side, no client-side
 *     fetch waterfall.
 *
 * `AddToCartButton` is a client island; everything around it stays
 * server-rendered.
 */
export default async function PastryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let item: PublicPastry;
  try {
    item = await apiFetch<PublicPastry>(`/pastries/${slug}`, {
      method: "GET",
      cache: "no-store",
    });
  } catch (err) {
    // API returns 404 for unknown slugs and for hidden (unavailable)
    // items — `getPublicBySlug` filters on `available: true`. Both
    // map to a clean Next.js 404 here so the route-group-scoped
    // not-found page renders cleanly inside the marketing layout.
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  // `AddToCartButton` branches on auth state. Reading the session
  // server-side keeps the choice deterministic — the button doesn't
  // need to do its own auth probe.
  const user = await getSessionUser();
  const isAuthed = Boolean(user);

  // Lead-time copy. We render the integer days converted into the
  // friendliest phrasing the kitchen actually uses ("same day",
  // "next day", "X days").
  const leadTimeLabel =
    item.leadTimeDays === 0
      ? "Same-day ready"
      : item.leadTimeDays === 1
      ? "Next-day ready"
      : `${item.leadTimeDays} days lead time`;

  return (
    // Marketing section wrapper matches every other content page so
    // the page sits flush under the sticky Header.
    <section className="px-page-gutter py-section-y">
      <div className="mx-auto max-w-page">
        {/*
          Crumb-style back link. Keeps the title hierarchy clean
          (one h1) while still giving the customer a one-tap path
          back to the menu they came from.
        */}
        <p className="eyebrow mb-3">
          <Link
            href="/pastries"
            className="text-orange-700 no-underline hover:text-orange-800"
          >
            ← Back to pastries
          </Link>
        </p>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* ---- Image column ---- */}
          {/*
            Image is a clickable affordance only when there's a real
            image — placeholder gradients remain decorative. We use
            `role="img"` + `aria-label` because the underlying
            element is a div with background-image, not an <img>.
            That keeps the page snappy (no extra image element +
            layout shift) while preserving accessibility.
          */}
          <div
            role="img"
            aria-label={item.imageAlt ?? `${item.name} — pastry by Nimi Events`}
            className="aspect-[4/3] w-full bg-gradient-to-br from-orange-200 to-maroon-700"
            style={
              item.imageUrl
                ? heroBackground(item.imageUrl)
                : { background: "linear-gradient(135deg,#ECA068,#5C1F18)" }
            }
          />

          {/* ---- Detail column ---- */}
          <div className="flex flex-col">
            <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
              {item.name}
            </h1>
            <p className="m-0 mb-6 font-display text-3xl font-medium text-orange-700">
              {fmtGBP(item.priceMinor, item.currency)}
            </p>

            {/*
              Rule + lead-time tags. Compact and scannable; sit
              above the description so customers see the rules
              before reading the marketing copy.
            */}
            <div className="mb-6 flex flex-wrap gap-2">
              {item.minQuantity > 1 ? (
                <Tag variant="orange">Minimum order {item.minQuantity}</Tag>
              ) : null}
              <Tag>{leadTimeLabel}</Tag>
              {item.tags.includes("limited") ? (
                <Tag variant="orange">Limited batch</Tag>
              ) : null}
            </div>

            {item.description ? (
              <p className="m-0 mb-8 max-w-prose whitespace-pre-line font-sans text-lg text-neutral-700">
                {item.description}
              </p>
            ) : (
              <p className="m-0 mb-8 font-sans text-base italic text-neutral-500">
                Full description coming soon.
              </p>
            )}

            {/*
              Inline add-to-cart. The card grid uses the same
              component as a floating pill, but on a detail page we
              want a wider primary action that reads as the page's
              call to action. Wrapping it in a bordered surface
              gives it the visual weight a hero CTA deserves
              without forking the component itself.
            */}
            <div className="mt-auto inline-flex items-center gap-3 self-start border border-cream-200 bg-cream-50 px-4 py-3">
              <AddToCartButton
                pastryItemId={item.id}
                itemName={item.name}
                isAuthed={isAuthed}
                slug={item.slug}
                description={item.description}
                imageUrl={item.imageUrl}
                unitPriceMinor={item.priceMinor}
                currency={item.currency}
              />
              <p className="m-0 font-sans text-xs italic text-neutral-500">
                Indulgence Credits apply automatically at checkout.
              </p>
            </div>

            {/*
              Operator commitments + housekeeping. Kept light so the
              add-to-cart action above remains the focal point.
            */}
            {item.tags.length > 0 ? (
              <p className="mt-8 font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
                {item.tags.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
