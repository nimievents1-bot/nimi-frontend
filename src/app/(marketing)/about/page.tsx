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
      <section className="px-page-gutter py-section-y">
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
              Nimi began at a family table, in a kitchen that always seemed to expand to fit one
              more chair. The smell of jollof simmering on a Sunday afternoon, the laughter that
              followed plates being passed around — that's where this story starts. Authentically
              African flavours, served the way they were meant to be: with care, with intent, with
              love.
            </p>
            <p className="mb-4 font-sans text-base leading-relaxed text-neutral-800">
              What was a Sunday ritual became a small business, and then a team, and then a calendar
              of weddings, corporate days and quiet birthdays across the UK. Through every shift,
              the standard hasn't moved. We cook real food, we serve it with care, and we treat
              every event like our own.
            </p>
            <p className="mb-4 font-sans text-base leading-relaxed text-neutral-800">
              Whether you're ordering a single gift box or planning a wedding for two hundred
              guests, you'll get the same answer when you call: <em>what do you need?</em>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
