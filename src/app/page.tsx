import { type Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/patterns/Card";
import { Faq } from "@/components/patterns/Faq";
import { Footer } from "@/components/patterns/Footer";
import { Header } from "@/components/patterns/Header";
import { Hero } from "@/components/patterns/Hero";
import { NewsletterForm } from "@/components/patterns/NewsletterForm";
import { Testimonials } from "@/components/patterns/Testimonials";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { getBlock } from "@/lib/content";
import { heroBackground, images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Nimi Events — Authentically African catering, planning & gifting",
  description:
    "Authentically African flavours, considered planning, and gifts that arrive on time. Catering, event planning, gifting, content creation, and The Nimi Indulgence Club.",
};

const services = [
  {
    eyebrow: "Catering",
    title: "Authentically African flavours.",
    description:
      "Seasonal menus, set-up, service and styling — for weddings, corporate events, and intimate gatherings across the UK.",
    href: "/catering",
    mediaStyle: heroBackground(images.services.catering),
  },
  {
    eyebrow: "Event planning",
    title: "Hosted with care.",
    description:
      "Three tiers of planning — coordination, design, and full production. We quietly run the day so you don't have to.",
    href: "/events",
    mediaStyle: heroBackground(images.services.events),
  },
  {
    eyebrow: "Gifting",
    title: "Gift boxes, made to order.",
    description:
      "Curated collections for corporate, weddings and private events — fully personalised, brand-led, and crafted with intent.",
    href: "/gifting",
    mediaStyle: heroBackground(images.services.gifting),
  },
  {
    eyebrow: "Content creation",
    title: "Event media, captured well.",
    description:
      "Mobile videography and photography for weddings, brand activations and milestone moments — same crew, same standard, same care.",
    href: "/content-creation",
    mediaStyle: heroBackground(images.services.content),
  },
];

const homeFaq = [
  {
    question: "How far in advance should I book?",
    answer:
      "For larger events we recommend three to six months' notice; smaller events a maximum of three months. Rush windows depend on the calendar.",
  },
  {
    question: "Where are you based and do you travel?",
    answer:
      "We're based in Bradford / Leeds and cater across the UK. Travel is available with additional charges, agreed at quote stage.",
  },
  {
    question: "Can I customise a gift box?",
    answer:
      "Yes — every collection is fully customisable. Names, dates, logos, colour themes, messaging. Production time is six to twelve weeks depending on complexity.",
  },
  {
    question: "How does The Nimi Indulgence Club work?",
    answer:
      "Set a monthly amount that becomes Indulgence Credits, valid for two to three months. Use them on freshly made pastries, with priority access and surprise drops along the way. Minimum commitment is three months.",
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
          eyebrow={hero?.eyebrow ?? "Catering · Events · Gifting · Content"}
          title={hero?.headline ?? "Where good food gathers."}
          lede={
            hero?.subheadline ??
            "Authentically African flavours, considered planning, and gifts that arrive on time."
          }
          imageUrl={hero?.imageUrl ?? images.hero.home}
        />
      </div>

      <main>
        <section className="bg-cream-50 px-page-gutter py-section-y">
          <div className="mx-auto max-w-page">
            <p className="eyebrow mb-3">What we do</p>
            <h2 className="m-0 mb-8 max-w-3xl font-display text-4xl font-medium text-maroon-600">
              Four services, one standard.
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <Card key={s.href} {...s} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-100 px-page-gutter py-section-y">
          <div className="mx-auto grid max-w-page gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="eyebrow mb-3">The Nimi Indulgence Club</p>
              <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
                Plan your indulgence.
              </h2>
              <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
                Set aside a monthly indulgence allowance that turns into curated pastries, made
                fresh by Nimi Events. Priority access, exclusive drops, and the occasional surprise
                — instead of last-minute spending.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/cravings">
                  <Button>Join the club</Button>
                </Link>
                <Tag variant="orange">3-month minimum · Credits valid 3 months</Tag>
              </div>
            </div>
            <div
              role="img"
              aria-label="A curated pastry box from The Nimi Indulgence Club"
              className="aspect-[5/4] bg-gradient-to-br from-orange-200 to-maroon-700"
              style={heroBackground(images.cravings.teaser)}
            />
          </div>
        </section>

        <section className="bg-cream-50 px-page-gutter py-section-y">
          <div className="mx-auto max-w-page">
            <p className="eyebrow mb-3">From our clients</p>
            <h2 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">
              Quietly trusted.
            </h2>
            <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
              Real words from real events — weddings, corporate launches, intimate dinners,
              and Indulgence Club members. We add new ones every month.
            </p>
            <Testimonials limit={6} />
          </div>
        </section>

        <section className="bg-cream-100 px-page-gutter py-section-y">
          <div className="mx-auto grid max-w-page gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="eyebrow mb-3">Stay close</p>
              <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
                Subscribe to the Nimi list.
              </h2>
              <p className="mb-2 max-w-prose font-sans text-lg text-neutral-700">
                Be the first to receive:
              </p>
              <ul className="m-0 mb-6 max-w-prose list-disc space-y-1 pl-5 font-sans text-base text-neutral-700">
                <li>Event updates and new service launches</li>
                <li>Seasonal menus and limited-batch drops</li>
                <li>Exclusive offers for subscribers</li>
                <li>New collection previews and gifting reveals</li>
              </ul>
              <p className="font-sans text-xs text-neutral-500">
                One email at a time. No spam, unsubscribe whenever you like.
              </p>
            </div>
            <div className="rounded-none border border-cream-200 bg-cream-50 p-6 md:p-8">
              <NewsletterForm
                source="home"
                helperText="We send a confirmation email to verify your address — open it to activate your subscription."
              />
            </div>
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
