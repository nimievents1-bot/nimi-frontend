import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { heroBackground } from "@/lib/images";
import { siteImages } from "@/lib/siteImages";

export const metadata: Metadata = {
  title: "Event content creation — mobile videography & photography",
  description:
    "Mobile videography and photography for weddings, brand activations, milestone celebrations and editorial events. Same crew, same standard, same care.",
};

/**
 * Format cards. Image URLs are resolved INSIDE the component
 * because they depend on the admin overrides loaded via
 * `siteImages()`. Copy stays here as a module-level constant for
 * readability; the lookup happens once per render.
 */
const formatContent = [
  {
    eyebrow: "Photography",
    title: "Stills that hold the moment.",
    description:
      "Editorial-style photography that captures the room, the food, the people, and the small details that make the day feel like yours.",
    imageKey: "content.photography",
  },
  {
    eyebrow: "Mobile videography",
    title: "Films, made for the feed.",
    description:
      "Same-day reels and short films optimised for social — fast turnaround, cinematic feel, ready to share before the night is over.",
    imageKey: "content.videography",
  },
  {
    eyebrow: "Delivery",
    title: "Quick, considered, branded.",
    description:
      "Edited highlight reels within 48 hours. Full galleries within two weeks. Optional brand-tagged versions for corporate clients.",
    imageKey: "content.delivery",
  },
] as const;

export default async function ContentCreationPage() {
  // Resolve every image slot in a single batched call so the
  // admin overrides take effect immediately and we don't waterfall
  // five lookups in series.
  const imageMap = await siteImages(
    "hero.content-creation",
    "content.photography",
    "content.videography",
    "content.delivery",
    "content.bookings-promo",
  );
  const formats = formatContent.map((f) => ({
    eyebrow: f.eyebrow,
    title: f.title,
    description: f.description,
    mediaStyle: heroBackground(imageMap[f.imageKey] ?? ""),
  }));

  return (
    <>
      <Hero
        height="short"
        eyebrow="Content creation"
        title="Event media, captured well."
        lede="Mobile videography and photography for weddings, brand activations, and milestone celebrations — by the same team that runs your day."
        imageUrl={imageMap["hero.content-creation"] ?? ""}
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
            style={heroBackground(imageMap["content.bookings-promo"] ?? "")}
          />
        </div>
      </section>
    </>
  );
}
