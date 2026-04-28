import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";

import { EventsBookingForm } from "./EventsBookingForm";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Book a 30-minute consultation to discuss your event.",
};

export default function EventsBookingPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Event planning"
        title="Book a consultation."
        lede="Thirty minutes, focused on your event. We'll come back with a concept and a quote."
      />
      <section className="px-page-gutter py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-sans text-base text-neutral-700">
            Pick two preferred dates and times. We&rsquo;ll confirm one or suggest the closest
            alternative. Calendar-tool integration (Cal.com) lands later — for now this lightweight
            form keeps things simple.
          </p>
          <div className="mt-10">
            <EventsBookingForm />
          </div>
        </div>
      </section>
    </>
  );
}
