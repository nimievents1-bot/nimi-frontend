import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Event planning, hosted with care",
  description:
    "On-the-day coordination, design coordination, and full event production — three intentional tiers of planning, run quietly so you don't have to.",
};

/** Events tier slug used as a stable identifier in URLs and form payloads. */
type EventsTierSlug = "coordination" | "design" | "production";

interface EventsTier {
  slug: EventsTierSlug;
  eyebrow: string;
  title: string;
  description: string;
  bullets: ReadonlyArray<string>;
  flagship?: boolean;
  mediaStyle: ReturnType<typeof heroBackground>;
}

const tiers: ReadonlyArray<EventsTier> = [
  {
    slug: "coordination",
    eyebrow: "Tier 1",
    title: "Event Coordination",
    description:
      "On-the-day coordination — we hold the timeline and the suppliers, and quietly solve the small things so you don't have to.",
    bullets: [
      "On-the-day coordination only",
      "Timeline management",
      "Supplier coordination",
      "Problem solving during the event",
    ],
    mediaStyle: heroBackground(images.events.coordination),
  },
  {
    slug: "design",
    eyebrow: "Tier 2",
    title: "Event Design & Coordination",
    description:
      "Everything in Tier 1, plus styling direction — florals, signage, layout, and lighting designed to your vision and made coherent.",
    bullets: [
      "Everything in Tier 1",
      "Styling direction",
      "Floral concepts",
      "Signage and layout guidance",
      "Lighting and aesthetic design input",
    ],
    mediaStyle: heroBackground(images.events.design),
  },
  {
    slug: "production",
    eyebrow: "Tier 3",
    title: "Full Event Production",
    description:
      "End-to-end planning. From concept to last guest, we source, style, and run every moving part of the day.",
    bullets: [
      "Full end-to-end planning",
      "Concept creation",
      "Supplier sourcing and management",
      "Styling + execution",
      "Full day management",
    ],
    flagship: true,
    mediaStyle: heroBackground(images.events.production),
  },
];

export default function EventsPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Event planning"
        title="Hosted with care."
        lede="We quietly run the day so you don't have to."
        imageUrl={images.hero.events}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">About our planning</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Premium, calm, controlled, intentional.
          </h2>
          <p className="mb-12 max-w-prose font-sans text-lg text-neutral-700">
            We plan, coordinate and style weddings, milestone birthdays, brand activations and
            private dinners. Lead times are three to six months for full planning, and a maximum
            of three months for coordination only. Rush windows are calendar-dependent.
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
                <div className="flex flex-wrap gap-2">
                  <Link href="/events/consultation">
                    <Button size="sm" variant={tier.flagship ? "primary" : "secondary"}>
                      Book consultation
                    </Button>
                  </Link>
                  <Link href={`/events/booking?tier=${tier.slug}`}>
                    <Button size="sm" variant="ghost">
                      Free enquiry
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <p className="mt-10 max-w-prose font-sans text-base italic text-neutral-700">
            Custom pricing based on scope, season, and date. Consultations are paid:{" "}
            <Link
              href="/events/consultation"
              className="text-orange-700 underline underline-offset-4"
            >
              30 min · £10
            </Link>{" "}
            or{" "}
            <Link
              href="/events/consultation"
              className="text-orange-700 underline underline-offset-4"
            >
              60 min · £30
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
