import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Catering — Authentically African flavours",
  description:
    "Authentically African catering, crafted for every occasion. Buffet, family-style and plated service for weddings, corporate events and intimate gatherings across the UK.",
};

/** Catering tier slug used as a stable identifier in URLs and form payloads. */
type CateringTierSlug = "buffet" | "family-style" | "plated";

interface CateringTier {
  slug: CateringTierSlug;
  eyebrow: string;
  title: string;
  description: string;
  bullets: ReadonlyArray<string>;
  flagship?: boolean;
  mediaStyle: ReturnType<typeof heroBackground>;
}

const tiers: ReadonlyArray<CateringTier> = [
  {
    slug: "buffet",
    eyebrow: "Tier 1",
    title: "Buffet Service",
    description:
      "Self-serve, relaxed — perfect for casual events and gatherings where guests serve themselves at their own pace.",
    bullets: [
      "Buffet-style catering with chafer-warmed mains",
      "Relaxed, self-serve setup and presentation",
      "Ideal for casual events and gatherings",
    ],
    mediaStyle: heroBackground(images.catering.buffet),
  },
  {
    slug: "family-style",
    eyebrow: "Tier 2",
    title: "Family Style Service",
    description:
      "Shared platters served to each table for a warm, communal dining experience with elevated presentation.",
    bullets: [
      "Shared platters served to tables",
      "Warm, communal dining experience",
      "Slightly more elevated presentation than buffet",
    ],
    mediaStyle: heroBackground(images.catering.familyStyle),
  },
  {
    slug: "plated",
    eyebrow: "Tier 3",
    title: "Plated Service",
    description:
      "Fully plated meals delivered to each guest — a formal dining experience with full service staff and considered presentation.",
    bullets: [
      "Fully plated meals to every guest",
      "Formal dining experience",
      "Full service staff and presentation",
    ],
    flagship: true,
    mediaStyle: heroBackground(images.catering.plated),
  },
];

export default function CateringPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Catering"
        title="Authentically African catering, crafted for every occasion."
        lede="Rooted in African flavours. Designed for memorable gatherings."
        imageUrl={images.hero.catering}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">About our catering</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Service is intentional, professional, and detail-focused.
          </h2>
          <p className="mb-12 max-w-prose font-sans text-lg text-neutral-700">
            We cater across the UK for weddings, corporate events, and intimate gatherings. Every
            menu is thoughtfully curated and focused on authentic African flavours with modern
            execution; every crew is briefed and present. Lead times are three to six months for
            larger events and a maximum of three months for smaller ones. Rush windows depend on
            the calendar.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.slug}
                eyebrow={tier.eyebrow}
                title={tier.title}
                description={tier.description}
                flagship={tier.flagship}
                mediaStyle={tier.mediaStyle}
              >
                <ul className="m-0 mb-5 list-disc space-y-1 pl-5 font-sans text-sm text-neutral-700">
                  {tier.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <Link href={`/catering/booking?tier=${tier.slug}`}>
                  <Button size="sm" variant={tier.flagship ? "primary" : "secondary"}>
                    Enquire
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          <p className="mt-10 max-w-prose font-sans text-base italic text-neutral-700">
            Custom pricing based on guest count, menu, and service style.
          </p>
        </div>
      </section>
    </>
  );
}
