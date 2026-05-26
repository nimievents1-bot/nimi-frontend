import { type Metadata } from "next";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Gifting",
  robots: { index: false, follow: false },
};

interface Collection {
  slug: string;
  category: "CORPORATE" | "WEDDINGS" | "PRIVATE";
  name: string;
  description: string;
  unitPriceMinor: number;
  priceMaxMinor: number | null;
  currency: string;
  moq: number;
  imageUrl: string | null;
}

/**
 * Per-slug fallback photography for gift collections that haven't had
 * a hero image uploaded yet. Mirrors the public `/gifting` page so the
 * account view stays visually consistent with the marketing surface.
 */
const COLLECTION_FALLBACK_IMAGE: Record<string, string> = {
  "essential-collection": images.gifting.essential,
  "signature-collection": images.gifting.signature,
  "executive-series": images.gifting.executive,
  "heritage-collection": images.gifting.heritage,
  "soft-luxe-box": images.gifting.softLuxe,
  "classic-keepsake": images.gifting.classicKeepsake,
  "luxe-collection": images.gifting.luxe,
  "celebration-box": images.gifting.celebration,
};

const CATEGORY_FALLBACK_IMAGE: Record<Collection["category"], string> = {
  CORPORATE: images.gifting.signature,
  WEDDINGS: images.gifting.heritage,
  PRIVATE: images.gifting.softLuxe,
};

function collectionImage(c: Collection): string {
  if (c.imageUrl) return c.imageUrl;
  return COLLECTION_FALLBACK_IMAGE[c.slug] ?? CATEGORY_FALLBACK_IMAGE[c.category];
}

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * Account-context gift collections.
 *
 * Reached from the dashboard's "Gifting" card. Mirrors the public
 * `/gifting` browse experience inside the account sidebar layout —
 * customers see what's available and click through to the existing
 * public detail page (`/gifting/[slug]`) to start a gifting order
 * (the checkout flow already lives there).
 *
 * Prominent button at the top deep-links into the gift-orders
 * section of the unified `/account/orders` page, so customers who
 * landed here looking for their existing orders rather than to
 * browse new ones are one click from the right place.
 *
 * We deliberately don't duplicate the marketing site's full
 * gifting hero / category nav here — the account surface is for
 * task-focused browsing, not for re-pitching the service.
 */
export default async function AccountGiftingPage() {
  let collections: Collection[] = [];
  try {
    collections = await apiFetch<Collection[]>("/gifting/collections", {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    // Empty state will render below — the account layout still shows.
  }

  return (
    <>
      <p className="eyebrow mb-2">Bespoke gifting</p>
      <h1 className="m-0 mb-2 font-display text-5xl font-medium text-maroon-600">
        Gift collections
      </h1>
      <p className="mb-6 max-w-prose font-sans text-base text-neutral-700">
        Made-to-order gift boxes for corporate events, weddings and private
        celebrations. Browse the collections and tap one to start an order.
      </p>

      <div className="mb-10 flex flex-wrap gap-3">
        {/*
          Deep-link to the gift-orders section of the unified orders
          page. Same hash the dashboard's Gifting card uses, so
          customers who navigate here looking for an existing order
          land where they expect without needing to scroll past
          pastry orders.
        */}
        <Link
          href="/account/orders#gift-orders"
          className="inline-flex items-center justify-center bg-maroon-600 px-5 py-2.5 font-display text-base italic text-cream-50 hover:bg-maroon-700"
        >
          View my gift orders
        </Link>
        <Link
          href="/gifting"
          className="inline-flex items-center justify-center border border-cream-200 bg-cream-100 px-5 py-2.5 font-display text-base italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100"
        >
          See full marketing page
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">
            No collections available right now. Check back shortly — new boxes
            launch each season.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.slug}
              href={`/gifting/${c.slug}`}
              className="group block overflow-hidden border border-cream-200 bg-cream-50 no-underline transition-colors hover:border-orange-200"
            >
              <div
                role="img"
                aria-label={`${c.name} — gift collection`}
                className="aspect-[4/3] w-full bg-gradient-to-br from-orange-200 to-maroon-700 transition-transform duration-base ease-brand group-hover:scale-105"
                style={heroBackground(collectionImage(c))}
              />
              <div className="px-4 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="m-0 font-display text-xl font-semibold text-maroon-700">
                    {c.name}
                  </h3>
                  <span className="font-display text-base font-medium text-orange-700">
                    {c.priceMaxMinor && c.priceMaxMinor > c.unitPriceMinor
                      ? `${fmtGBP(c.unitPriceMinor, c.currency)}–${fmtGBP(
                          c.priceMaxMinor,
                          c.currency,
                        )}`
                      : fmtGBP(c.unitPriceMinor, c.currency)}
                  </span>
                </div>
                {c.description ? (
                  <p className="m-0 mt-2 font-sans text-sm text-neutral-700">
                    {c.description}
                  </p>
                ) : null}
                {c.moq > 1 ? (
                  <p className="m-0 mt-2 font-sans text-xs uppercase tracking-[0.16em] text-orange-700">
                    Minimum order {c.moq}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      {collections.length > 0 ? (
        <p className="mt-6 max-w-prose font-sans text-xs italic text-neutral-500">
          Production time six to twelve weeks depending on complexity. Final
          designs need approval before kitchen work begins.
        </p>
      ) : null}
    </>
  );
}
