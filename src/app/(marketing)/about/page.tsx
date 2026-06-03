import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { SocialLinks } from "@/components/patterns/SocialLinks";
import { heroBackground } from "@/lib/images";
import { siteImages } from "@/lib/siteImages";
import { siteSettings } from "@/lib/siteSettings";

export const metadata: Metadata = {
  title: "About",
  description: "The story of Nimi Events — family kitchen, hospitality standard.",
};

/**
 * Split an admin-managed body string into paragraphs.
 *
 * The settings registry stores body fields as a single multiline
 * value with blank lines as paragraph boundaries — that lets the
 * operator add or remove paragraphs without us hardcoding a fixed
 * number of slots. We split on one-or-more blank lines (so the
 * operator can use either Unix or Windows newlines, and accidental
 * extra blank lines don't create empty paragraphs).
 */
function paragraphs(body: string): string[] {
  return body
    .split(/(?:\r?\n){2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export default async function AboutPage() {
  // Resolve every image AND text slot the page uses in a single
  // batched call each, so admin overrides take effect immediately
  // without serial waterfall lookups. Both helpers fail-open: if
  // the API is briefly unavailable the page renders code-level
  // defaults from the registries.
  const [imageMap, text] = await Promise.all([
    siteImages("hero.about", "about.founder"),
    siteSettings(
      "about.hero.eyebrow",
      "about.hero.title",
      "about.hero.lede",
      "about.story.eyebrow",
      "about.story.heading",
      "about.story.body",
      "about.social.eyebrow",
    ),
  ]);

  return (
    <>
      <Hero
        height="short"
        eyebrow={text["about.hero.eyebrow"] ?? ""}
        title={text["about.hero.title"] ?? ""}
        lede={text["about.hero.lede"] ?? ""}
        imageUrl={imageMap["hero.about"] ?? ""}
      />
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto grid max-w-page gap-12 md:grid-cols-[1fr_1.2fr]">
          <div
            role="img"
            aria-label="Founder portrait — kitchen workspace"
            className="aspect-[3/4] bg-gradient-to-br from-orange-300 to-maroon-700"
            style={heroBackground(imageMap["about.founder"] ?? "")}
          />
          <div className="max-w-prose">
            <p className="eyebrow mb-3">{text["about.story.eyebrow"]}</p>
            <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
              {text["about.story.heading"]}
            </h2>
            {paragraphs(text["about.story.body"] ?? "").map((para, i) => (
              <p
                key={i}
                className="mb-4 font-sans text-base leading-relaxed text-neutral-800"
              >
                {para}
              </p>
            ))}

            {/* Social — soft footer at the end of the founder story.
                The voice of the about page is intimate, so the
                section heading defaults to "Stay close" rather than
                the more transactional "Follow us" used in the
                footer; the operator can rewrite it via /admin/settings. */}
            <p className="mt-8 mb-3 font-sans text-xs font-bold uppercase tracking-[0.26em] text-maroon-700">
              {text["about.social.eyebrow"]}
            </p>
            <SocialLinks tone="light" withLabels />
          </div>
        </div>
      </section>
    </>
  );
}
