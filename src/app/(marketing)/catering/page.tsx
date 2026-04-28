import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Catering",
  description:
    "Three catering packages — Basic, Premium and Platinum — for weddings, corporate events and intimate gatherings.",
};

const tiers: Array<{
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  flagship?: boolean;
  mediaStyle: ReturnType<typeof heroBackground>;
}> = [
  {
    eyebrow: "Tier I",
    title: "Basic",
    description:
      "Entry-level catering for smaller gatherings — a thoughtful core menu, set-up, service and clean styling.",
    price: "From £45 / guest",
    mediaStyle: heroBackground(images.catering.basic),
  },
  {
    eyebrow: "Tier II",
    title: "Premium",
    description:
      "The most-requested package — expanded menu, a dedicated event lead, and styling that elevates the room.",
    price: "From £75 / guest",
    mediaStyle: heroBackground(images.catering.premium),
  },
  {
    eyebrow: "Tier III",
    title: "Platinum",
    description:
      "Full-service flagship — bespoke menu design, premium styling, full crew and a tasting before the day.",
    price: "From £140 / guest",
    flagship: true,
    mediaStyle: heroBackground(images.catering.platinum),
  },
];

export default function CateringPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Catering"
        title="Where good food gathers."
        lede="Three packages, one standard."
        imageUrl={images.hero.catering}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">About our catering</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Hospitality is the standard, not the headline.
          </h2>
          <p className="mb-12 max-w-prose font-sans text-lg text-neutral-700">
            We cater across the UK for weddings, corporate days and intimate gatherings. Every menu
            is seasonal and thoughtful, every service crew is briefed and present. Lead times are
            six to twelve months for larger events; minimum three months for smaller. Rush windows
            depend on the calendar.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.title} {...tier}>
                <p className="mb-3 font-display text-lg font-semibold text-orange-700">
                  {tier.price}
                </p>
                <Link href="/catering/booking">
                  <Button size="sm" variant={tier.flagship ? "primary" : "secondary"}>
                    Enquire
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
