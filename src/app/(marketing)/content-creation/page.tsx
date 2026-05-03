import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Event content creation — mobile videography & photography",
  description:
    "Mobile videography and photography for weddings, brand activations, milestone celebrations and editorial events. Same crew, same standard, same care.",
};

const formats: Array<{
  eyebrow: string;
  title: string;
  description: string;
  mediaStyle: ReturnType<typeof heroBackground>;
}> = [
  {
    eyebrow: "Photography",
    title: "Stills that hold the moment.",
    description:
      "Editorial-style photography that captures the room, the food, the people, and the small details that make the day feel like yours.",
    mediaStyle: heroBackground(images.content.photography),
  },
  {
    eyebrow: "Mobile videography",
    title: "Films, made for the feed.",
    description:
      "Same-day reels and short films optimised for social — fast turnaround, cinematic feel, ready to share before the night is over.",
    mediaStyle: heroBackground(images.content.videography),
  },
  {
    eyebrow: "Delivery",
    title: "Quick, considered, branded.",
    description:
      "Edited highlight reels within 48 hours. Full galleries within two weeks. Optional brand-tagged versions for corporate clients.",
    mediaStyle: heroBackground(images.content.delivery),
  },
];

export default function ContentCreationPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Content creation"
        title="Event media, captured well."
        lede="Mobile videography and photography for weddings, brand activations, and milestone celebrations — by the same team that runs your day."
        imageUrl={images.content.hero}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">What we cover</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            One crew. Two formats. Quietly capturing.
          </h2>
          <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
            We work alongside your event team — never in the way of your guests — to capture the
            room as it is. Photography for the album, mobile-first videography for the feed,
            delivered fast and finished cleanly. Available stand-alone, or bundled with our
            catering and event-planning services.
          </p>
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <Tag variant="orange">Same-day reels</Tag>
            <Tag>Editorial photography</Tag>
            <Tag variant="maroon">Brand-tagged delivery</Tag>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {formats.map((f) => (
              <Card key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-100 px-page-gutter py-section-y">
        <div className="mx-auto grid max-w-page gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow mb-3">Bookings</p>
            <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
              Pricing is custom.
            </h2>
            <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
              Custom pricing based on event length, deliverables, and crew size. Minimum half-day
              bookings. Tell us about your event and we'll send a quote within one working day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/contact?topic=content-creation">
                <Button>Enquire about content</Button>
              </Link>
              <Link href="/events">
                <Button variant="secondary">Browse event packages</Button>
              </Link>
            </div>
          </div>
          <div
            role="img"
            aria-label="A photographer at work during an event"
            className="aspect-[5/4] bg-gradient-to-br from-orange-200 to-maroon-700"
            style={heroBackground(images.content.videography)}
          />
        </div>
      </section>
    </>
  );
}
