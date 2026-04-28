import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
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
          <p className="mb-10 font-sans text-base text-neutral-700">
            You can also write directly to{" "}
            <a
              className="text-orange-600 underline underline-offset-4"
              href="mailto:hello@nimievents.co.uk"
            >
              hello@nimievents.co.uk
            </a>
            .
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
