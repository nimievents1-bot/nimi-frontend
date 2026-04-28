import { type Metadata } from "next";

import { Card } from "@/components/patterns/Card";
import { Faq } from "@/components/patterns/Faq";
import { Footer } from "@/components/patterns/Footer";
import { Header } from "@/components/patterns/Header";
import { Hero } from "@/components/patterns/Hero";
import { Testimonial } from "@/components/patterns/Testimonial";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { getBlock } from "@/lib/content";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Nimi Events — Where good food gathers",
  description:
    "Catering, event planning, bespoke gift boxes, and a monthly pastry subscription. Family kitchen, hospitality standard.",
};

const services = [
  {
    eyebrow: "Catering",
    title: "Plates that travel.",
    description:
      "Seasonal menus, set-up, service and styling — for weddings, corporate days and intimate dinners.",
    href: "/catering",
    mediaStyle: heroBackground(images.services.catering),
  },
  {
    eyebrow: "Event planning",
    title: "Hosted with care.",
    description:
      "Planning, coordination and styling — three packages, one standard. We hold the day so you can be in it.",
    href: "/events",
    mediaStyle: heroBackground(images.services.events),
  },
  {
    eyebrow: "Gifting",
    title: "Gift boxes, made to order.",
    description:
      "Eight curated collections for corporate, weddings and private events — fully personalised, made for the moment.",
    href: "/gifting",
    mediaStyle: heroBackground(images.services.gifting),
  },
];

const homeFaq = [
  {
    question: "How far in advance should I book?",
    answer:
      "For larger events we recommend six to twelve months. Smaller events can usually be served at a minimum of three months’ notice; rush windows depend on the calendar.",
  },
  {
    question: "Can I customise a gift box?",
    answer:
      "Yes — every collection is fully customisable. Names, dates, logos, colour themes, messaging. Production lead time is six to ten weeks.",
  },
  {
    question: "How does the Pastry Cravings subscription work?",
    answer:
      "Pick a monthly amount; it’s added to your Cravings credit each month, and rolls over if you don’t use it. Pause or cancel any time.",
  },
];

interface HeroPayload {
  imageUrl: string | null;
  alt: string;
  eyebrow: string | null;
  headline: string;
  subheadline: string | null;
}

export default async function HomePage() {
  // Fetch the hero from the CMS; fall back to brand defaults if no block published yet.
  const heroBlock = await getBlock<HeroPayload>("home", "hero");
  const hero = heroBlock?.payload;

  return (
    <>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-10">
          <Header current="/" onDark />
        </div>
        <Hero
          eyebrow={hero?.eyebrow ?? "Catering · Events · Gifting"}
          title={hero?.headline ?? "Where good food gathers."}
          lede={hero?.subheadline ?? "Authentic flavours, considered planning, and gifts that arrive on time."}
          imageUrl={hero?.imageUrl ?? images.hero.home}
        />
      </div>

      <main>
        <section className="bg-cream-50 px-page-gutter py-section-y">
          <div className="mx-auto max-w-page">
            <p className="eyebrow mb-3">What we do</p>
            <h2 className="m-0 mb-8 max-w-3xl font-display text-4xl font-medium text-maroon-600">
              Three things, done with care.
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {services.map((s) => (
                <Card key={s.href} {...s} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-100 px-page-gutter py-section-y">
          <div className="mx-auto grid max-w-page gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="eyebrow mb-3">Pastry Cravings</p>
              <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
                A small, monthly indulgence.
              </h2>
              <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
                Set a monthly amount, build credit, and redeem it whenever a craving strikes.
                Roll-over by default, pause when life gets busy.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Explore the plans</Button>
                <Tag variant="orange">From £25/month</Tag>
              </div>
            </div>
            <div
              role="img"
              aria-label="A pastry box from the Pastry Cravings collection"
              className="aspect-[5/4] bg-gradient-to-br from-orange-200 to-maroon-700"
              style={heroBackground(images.cravings.teaser)}
            />
          </div>
        </section>

        <section className="bg-cream-50 px-page-gutter py-section-y">
          <div className="mx-auto max-w-page">
            <Testimonial
              quote="Nimi catered our 200-guest wedding and the kitchen ran like a metronome. Two months on, our families are still talking about the puff-puff and pepper-soup station."
              attribution="Ada & Tobi · Wedding · September 2025"
            />
          </div>
        </section>

        <section className="bg-cream-50 px-page-gutter py-section-y">
          <div className="mx-auto max-w-page">
            <p className="eyebrow mb-3">FAQ</p>
            <h2 className="m-0 mb-8 font-display text-4xl font-medium text-maroon-600">
              Quick answers.
            </h2>
            <Faq items={homeFaq} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
