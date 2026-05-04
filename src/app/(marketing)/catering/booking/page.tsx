import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";

import { CateringBookingForm, type ServiceStyleSlug } from "./CateringBookingForm";

export const metadata: Metadata = {
  title: "Catering enquiry",
  description: "Tell us about your event and we'll get back to you within one working day.",
};

const VALID_TIERS: ReadonlySet<ServiceStyleSlug> = new Set([
  "buffet",
  "family-style",
  "plated",
]);

interface PageProps {
  // Next.js App Router exposes URL query params via the `searchParams` prop.
  // Anything the user types into the URL bar reaches us as a string|string[],
  // so we narrow to a known tier slug before forwarding to the form.
  searchParams?: { tier?: string };
}

export default function CateringBookingPage({ searchParams }: PageProps) {
  const raw = searchParams?.tier;
  const initialTier = raw && VALID_TIERS.has(raw as ServiceStyleSlug)
    ? (raw as ServiceStyleSlug)
    : undefined;

  return (
    <>
      <Hero
        height="short"
        eyebrow="Catering"
        title="Tell us about your event."
        lede="The more we know, the better we can plan. We reply within one working day."
      />
      <section className="px-page-gutter section-tight">
        <div className="mx-auto max-w-2xl">
          <p className="font-sans text-base text-neutral-700">
            Lead times are three to six months for larger events and a maximum of three months
            for smaller ones. Rush windows depend on the calendar.
          </p>
          <div className="mt-10">
            {/* Spread `initialTier` only when present — `exactOptionalPropertyTypes`
                rejects passing literal `undefined` to an optional prop. */}
            <CateringBookingForm {...(initialTier ? { initialTier } : {})} />
          </div>
        </div>
      </section>
    </>
  );
}
