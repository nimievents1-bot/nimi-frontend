import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { Hero } from "@/components/patterns/Hero";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";
import { heroBackground, images } from "@/lib/images";

const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  CORPORATE: images.gifting.essential,
  WEDDINGS: images.gifting.heritage,
  PRIVATE: images.gifting.softLuxe,
};

const SLUG_FALLBACK_IMAGE: Record<string, string> = {
  "essential-collection": images.gifting.essential,
  "signature-collection": images.gifting.signature,
  "executive-series": images.gifting.executive,
  "heritage-collection": images.gifting.heritage,
  "soft-luxe-box": images.gifting.softLuxe,
  "classic-keepsake": images.gifting.classicKeepsake,
  "luxe-experience": images.gifting.luxe,
  "celebration-edit": images.gifting.celebration,
};

import { GiftCheckoutForm } from "./GiftCheckoutForm";

interface Collection {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
  items: string[];
  unitPriceMinor: number;
  priceMaxMinor: number | null;
  currency: string;
  moq: number;
  leadTimeDays: number;
  imageUrl: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const c = await apiFetch<Collection>(`/gifting/collections/${params.slug}`, {
      method: "GET",
      next: { revalidate: 60 },
      throwOnError: true,
    });
    return {
      title: c.name,
      description: c.description.slice(0, 160),
    };
  } catch {
    return { title: "Gift collection" };
  }
}

export default async function GiftCollectionPage({ params }: { params: { slug: string } }) {
  let c: Collection;
  try {
    c = await apiFetch<Collection>(`/gifting/collections/${params.slug}`, {
      method: "GET",
      next: { revalidate: 60, tags: [`gift-collection:${params.slug}`] },
      throwOnError: true,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const fmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: c.currency.toUpperCase() });
  const unit = fmt.format(c.unitPriceMinor / 100);
  const max = c.priceMaxMinor ? fmt.format(c.priceMaxMinor / 100) : null;
  const priceLabel = max ? `${unit} – ${max}` : `${unit}`;

  return (
    <>
      <Hero
        height="short"
        eyebrow={`Gifting · ${categoryLabel(c.category)}`}
        title={c.name}
        lede={c.description}
        imageUrl={
          c.imageUrl ?? SLUG_FALLBACK_IMAGE[c.slug] ?? CATEGORY_FALLBACK_IMAGE[c.category] ?? images.hero.gifting
        }
      />
      <section className="px-page-gutter py-20">
        <div className="mx-auto grid max-w-page gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Tag variant="orange">{`Lead time ${Math.round(c.leadTimeDays / 7)} wks`}</Tag>
              <Tag>{`MOQ ${c.moq}`}</Tag>
              <Tag variant="maroon">{priceLabel} per box</Tag>
            </div>

            <div
              role="img"
              aria-label={`Photograph representing ${c.name}`}
              className="mb-8 aspect-[4/3] w-full bg-gradient-to-br from-orange-300 to-maroon-500"
              style={heroBackground(
                c.imageUrl ??
                  SLUG_FALLBACK_IMAGE[c.slug] ??
                  CATEGORY_FALLBACK_IMAGE[c.category] ??
                  images.hero.gifting,
              )}
            />

            <h2 className="m-0 mb-3 font-display text-3xl font-medium text-maroon-600">What's inside</h2>
            <ul className="m-0 list-none p-0">
              {c.items.map((it) => (
                <li
                  key={it}
                  className="flex gap-3 border-b border-cream-200 py-2 font-sans text-base text-neutral-800"
                >
                  <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-orange-500" />
                  {it}
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-prose font-sans text-sm text-neutral-500">
              All boxes are bespoke and produced after design approval. Lead time is six to ten
              weeks depending on quantity and customisation. Rush orders are rarely possible.
            </p>
          </div>

          <aside>
            <GiftCheckoutForm
              slug={c.slug}
              name={c.name}
              moq={c.moq}
              unitPriceMinor={c.unitPriceMinor}
              currency={c.currency}
            />
          </aside>
        </div>
      </section>
    </>
  );
}

function categoryLabel(c: string) {
  if (c === "CORPORATE") return "Corporate";
  if (c === "WEDDINGS") return "Weddings & events";
  if (c === "PRIVATE") return "Private events";
  return c;
}
