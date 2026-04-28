import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";

import { CateringBookingForm } from "./CateringBookingForm";

export const metadata: Metadata = {
  title: "Catering enquiry",
  description: "Tell us about your event and we'll get back to you within one working day.",
};

export default function CateringBookingPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Catering"
        title="Tell us about your event."
        lede="The more we know, the better we can plan. We reply within one working day."
      />
      <section className="px-page-gutter py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-sans text-base text-neutral-700">
            Lead times: 6–12 months for larger events, minimum three months for smaller ones.
            Rush windows depend on the calendar.
          </p>
          <div className="mt-10">
            <CateringBookingForm />
          </div>
        </div>
      </section>
    </>
  );
}
