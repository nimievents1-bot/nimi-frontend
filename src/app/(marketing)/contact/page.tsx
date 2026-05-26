import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { SocialLinks } from "@/components/patterns/SocialLinks";
import { images } from "@/lib/images";

import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Get in touch",
  description: "Tell us about your event, gift box, or pastry subscription.",
};

export default function ContactPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Hello"
        title="Get in touch."
        lede="Tell us a little about what you have in mind. We reply within one working day."
        imageUrl={images.hero.contact}
      />
      <section className="px-page-gutter section-tight">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow mb-3">Tell us about your event</p>
          <h2 className="m-0 mb-4 font-display text-4xl font-medium text-maroon-600">
            We&rsquo;re listening.
          </h2>
          <p className="mb-6 font-sans text-base text-neutral-700">
            You can also write directly to{" "}
            <a
              className="text-orange-600 underline underline-offset-4"
              href="mailto:nimi.events1@gmail.com"
            >
              nimi.events1@gmail.com
            </a>
            .
          </p>

          {/* Find us on social — full-label variant so the customer
              sees the handle, not just an icon. Sits above the form
              as an alternative reach-out path. */}
          <div className="mb-10 border border-cream-200 bg-paper p-5">
            <p className="m-0 mb-3 font-sans text-xs font-bold uppercase tracking-[0.26em] text-maroon-700">
              Or find us
            </p>
            <SocialLinks tone="light" withLabels />
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
