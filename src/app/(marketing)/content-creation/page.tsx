import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Hero } from "@/components/patterns/Hero";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { heroBackground } from "@/lib/images";
import { siteImages } from "@/lib/siteImages";
import { siteSettings } from "@/lib/siteSettings";

export const metadata: Metadata = {
  title: "Event content creation — mobile videography & photography",
  description:
    "Mobile videography and photography for weddings, brand activations, milestone celebrations and editorial events. Same crew, same standard, same care.",
};

/** Split a multi-paragraph body into <p>-ready chunks. */
function paragraphs(body: string): string[] {
  return body
    .split(/(?:\r?\n){2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Format card identifiers. Each card resolves three text fields
 * (eyebrow / title / description) and one image from the admin
 * registries. Keeping the structure as a const array means the
 * page renders deterministically even if the admin clears a
 * particular field — the fallback in the registry kicks in.
 */
const FORMAT_SLUGS = ["photography", "videography", "delivery"] as const;

export default async function ContentCreationPage() {
  // Two batched lookups — one images, one text. Run in parallel
  // because the two registries are independent. Each one fails
  // open: a transient API error returns the code-level fallback
  // rather than breaking the public page.
  const [imageMap, text] = await Promise.all([
    siteImages(
      "hero.content-creation",
      "content.photography",
      "content.videography",
      "content.delivery",
      "content.bookings-promo",
    ),
    siteSettings(
      "contentCreation.hero.eyebrow",
      "contentCreation.hero.title",
      "contentCreation.hero.lede",
      "contentCreation.intro.eyebrow",
      "contentCreation.intro.heading",
      "contentCreation.intro.body",
      "contentCreation.format.photography.eyebrow",
      "contentCreation.format.photography.title",
      "contentCreation.format.photography.description",
      "contentCreation.format.videography.eyebrow",
      "contentCreation.format.videography.title",
      "contentCreation.format.videography.description",
      "contentCreation.format.delivery.eyebrow",
      "contentCreation.format.delivery.title",
      "contentCreation.format.delivery.description",
      "contentCreation.bookings.eyebrow",
      "contentCreation.bookings.title",
      "contentCreation.bookings.body",
    ),
  ]);

  // Assemble the format cards from the registry lookups. Each
  // slug drives both a text-trio (eyebrow / title / description)
  // and a single image. Keyed off the slug so the operator can
  // rewrite either freely without us reordering the JSX.
  const formats = FORMAT_SLUGS.map((slug) => ({
    eyebrow: text[`contentCreation.format.${slug}.eyebrow`] ?? "",
    title: text[`contentCreation.format.${slug}.title`] ?? "",
    description: text[`contentCreation.format.${slug}.description`] ?? "",
    mediaStyle: heroBackground(imageMap[`content.${slug}`] ?? ""),
  }));

  return (
    <>
      <Hero
        height="short"
        eyebrow={text["contentCreation.hero.eyebrow"] ?? ""}
        title={text["contentCreation.hero.title"] ?? ""}
        lede={text["contentCreation.hero.lede"] ?? ""}
        imageUrl={imageMap["hero.content-creation"] ?? ""}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">{text["contentCreation.intro.eyebrow"]}</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            {text["contentCreation.intro.heading"]}
          </h2>
          {paragraphs(text["contentCreation.intro.body"] ?? "").map((para, i) => (
            <p
              key={i}
              className="mb-4 max-w-prose font-sans text-lg text-neutral-700 last:mb-10"
            >
              {para}
            </p>
          ))}
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
            <p className="eyebrow mb-3">{text["contentCreation.bookings.eyebrow"]}</p>
            <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
              {text["contentCreation.bookings.title"]}
            </h2>
            {paragraphs(text["contentCreation.bookings.body"] ?? "").map((para, i) => (
              <p
                key={i}
                className="mb-4 max-w-prose font-sans text-lg text-neutral-700 last:mb-6"
              >
                {para}
              </p>
            ))}
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
