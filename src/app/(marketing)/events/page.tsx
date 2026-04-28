import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Event planning & coordination",
  description:
    "Three packages — Basic, Premium and Platinum — covering full event planning, day-of coordination and styling.",
};

const tiers: Array<{
  eyebrow: string;
  title: string;
  description: string;
  flagship?: boolean;
  mediaStyle: ReturnType<typeof heroBackground>;
}> = [
  {
    eyebrow: "Tier I",
    title: "Basic",
    description:
      "Coordination on the day. We hold the timeline, the suppliers and the small crises so you can be present.",
    mediaStyle: heroBackground(images.events.basic),
  },
  {
    eyebrow: "Tier II",
    title: "Premium",
    description:
      "Coordination plus styling. Tablescape, florals, signage, lighting — designed to your direction, made coherent.",
    mediaStyle: heroBackground(images.events.premium),
  },
  {
    eyebrow: "Tier III",
    title: "Platinum",
    description:
      "End-to-end planning. Venue search, supplier curation, design, run-of-show, day-of crew. From idea to last guest.",
    flagship: true,
    mediaStyle: heroBackground(images.events.platinum),
  },
];

export default function EventsPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Event planning"
        title="Hosted with care."
        lede="Three packages, one standard."
        imageUrl={images.hero.events}
      />
      <section className="px-page-gutter py-24">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">About our planning</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Quietly running the day so you don&rsquo;t have to.
          </h2>
          <p className="mb-12 max-w-prose font-sans text-lg text-neutral-700">
            We plan, coordinate and style weddings, milestone birthdays, brand activations and
            private dinners. Lead times: 6–12 months for full planning, 3–6 months for coordination.
            Rush windows are calendar-dependent.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.title} {...tier}>
                <Link href="/events/booking">
                  <Button size="sm" variant={tier.flagship ? "primary" : "secondary"}>
                    Book consultation
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
