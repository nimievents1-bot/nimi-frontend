import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Gifting",
  description:
    "Made-to-order gift boxes for corporate events, weddings and private celebrations.",
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

const CATEGORY_GRADIENTS: Record<Collection["category"], string> = {
  CORPORATE: "linear-gradient(135deg,#F4EDDA,#A89779)",
  WEDDINGS: "linear-gradient(135deg,#F0CFC7,#A24632)",
  PRIVATE: "linear-gradient(135deg,#ECA068,#5C1F18)",
};

const FALLBACK: Collection[] = [
  {
    slug: "essential-collection",
    category: "CORPORATE",
    name: "The Essential Collection",
    description: "Clean, professional and practical everyday gifting.",
    unitPriceMinor: 1000,
    priceMaxMinor: 1500,
    currency: "gbp",
    moq: 25,
    imageUrl: null,
  },
  {
    slug: "signature-collection",
    category: "CORPORATE",
    name: "The Signature Collection",
    description: "Elevated branded gifting designed to impress clients and teams.",
    unitPriceMinor: 1300,
    priceMaxMinor: 2000,
    currency: "gbp",
    moq: 25,
    imageUrl: null,
  },
  {
    slug: "executive-series",
    category: "CORPORATE",
    name: "The Executive Series",
    description: "Premium gifting for senior clients and high-value relationships.",
    unitPriceMinor: 1800,
    priceMaxMinor: 2500,
    currency: "gbp",
    moq: 10,
    imageUrl: null,
  },
  {
    slug: "heritage-collection",
    category: "WEDDINGS",
    name: "The Heritage Collection",
    description: "Modern design with subtle cultural elements — Ankara pouch, custom tumbler, hand fan.",
    unitPriceMinor: 2400,
    priceMaxMinor: 3600,
    currency: "gbp",
    moq: 25,
    imageUrl: null,
  },
  {
    slug: "soft-luxe-box",
    category: "PRIVATE",
    name: "The Soft Luxe Box",
    description: "Lifestyle and self-care gifting — satin eye mask, candle, towel, mini pouch.",
    unitPriceMinor: 2800,
    priceMaxMinor: 4200,
    currency: "gbp",
    moq: 10,
    imageUrl: null,
  },
];

export default async function GiftingPage() {
  let collections: Collection[] = [];
  try {
    collections = await apiFetch<Collection[]>("/gifting/collections", {
      method: "GET",
      next: { revalidate: 60, tags: ["gift-collections"] },
      throwOnError: true,
    });
  } catch {
    // Until the founder seeds collections via the admin / Prisma Studio,
    // show a brand-styled placeholder set so the page is never empty.
    collections = FALLBACK;
  }

  return (
    <>
      <Hero
        height="short"
        eyebrow="Gifting"
        title="Made-to-order, made for the moment."
        lede="Curated collections across corporate, weddings and private events. Six to ten weeks lead time."
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Tag variant="orange">Lead time 6–10 wks</Tag>
            <Tag>Customisable</Tag>
            <Tag variant="maroon">Brandable</Tag>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {collections.map((c) => (
              <Link key={c.slug} href={`/gifting/${c.slug}`} className="block no-underline">
                <Card
                  eyebrow={categoryLabel(c.category)}
                  title={c.name}
                  description={c.description}
                  mediaStyle={
                    c.imageUrl
                      ? {
                          backgroundImage: `url("${c.imageUrl}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : { background: CATEGORY_GRADIENTS[c.category] }
                  }
                >
                  <p className="mb-3 font-display text-lg font-semibold text-orange-700">
                    {priceLabel(c)}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Tag>{`MOQ ${c.moq}`}</Tag>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function categoryLabel(c: Collection["category"]) {
  if (c === "CORPORATE") return "Corporate";
  if (c === "WEDDINGS") return "Weddings & events";
  return "Private events";
}

function priceLabel(c: Collection) {
  const fmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: c.currency.toUpperCase(),
  });
  const min = fmt.format(c.unitPriceMinor / 100);
  if (!c.priceMaxMinor) return `${min} per box`;
  return `${min} – ${fmt.format(c.priceMaxMinor / 100)} per box`;
}
