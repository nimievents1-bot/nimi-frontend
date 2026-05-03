import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";

import { EventsBookingForm, type EventsTierSlug } from "./EventsBookingForm";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Book a focused consultation to discuss your event.",
};

const VALID_TIERS: ReadonlySet<EventsTierSlug> = new Set([
  "coordination",
  "design",
  "production",
]);

interface PageProps {
  // App Router exposes URL query params here. Anything the user types is a
  // string, so we narrow before passing the slug down to the client form.
  searchParams?: { tier?: string };
}

export default function EventsBookingPage({ searchParams }: PageProps) {
  const raw = searchParams?.tier;
  const initialTier =
    raw && VALID_TIERS.has(raw as EventsTierSlug)
      ? (raw as EventsTierSlug)
      : undefined;

  return (
    <>
      <Hero
        height="short"
        eyebrow="Event planning"
        title="Book a consultation."
        lede="Focused conversation about your event. We'll come back with a concept and a quote."
      />
      <section className="px-page-gutter section-tight">
        <div className="mx-auto max-w-2xl">
          <p className="font-sans text-base text-neutral-700">
            Pick two preferred dates and times. We'll confirm one or suggest the closest
            alternative within one working day.
          </p>
          <div className="mt-10">
            <EventsBookingForm initialTier={initialTier} />
          </div>
        </div>
      </section>
    </>
  );
}
