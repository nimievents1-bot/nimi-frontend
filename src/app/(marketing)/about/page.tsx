import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "About",
  description: "The story of Nimi Events — family kitchen, hospitality standard.",
};

export default function AboutPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="About"
        title="A family kitchen, scaled with care."
        lede="Born from a stovetop, run like a hotel."
        imageUrl={images.hero.about}
      />
      <section className="px-page-gutter py-24">
        <div className="mx-auto grid max-w-page gap-12 md:grid-cols-[1fr_1.2fr]">
          <div
            role="img"
            aria-label="Founder portrait — kitchen workspace"
            className="aspect-[3/4] bg-gradient-to-br from-orange-300 to-maroon-700"
            style={heroBackground(images.about.founder)}
          />
          <div className="max-w-prose">
            <p className="eyebrow mb-3">The story</p>
            <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
              Cooking has always been our way of holding people.
            </h2>
            <p className="mb-4 font-sans text-base leading-relaxed text-neutral-800">
              Nimi began at home, with a kitchen that always seemed to expand to fit one more chair.
              Over the years what was a Sunday ritual became a small business, and then a team, and
              then a calendar full of weddings, corporate days and quiet birthdays.
            </p>
            <p className="mb-4 font-sans text-base leading-relaxed text-neutral-800">
              The standard hasn’t moved. We cook real food, we serve it with care, and we treat the
              event like our own. Whether you’re ordering a single gift box or planning a wedding
              for two hundred guests, you’ll get the same answer when you call: what do you need?
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
