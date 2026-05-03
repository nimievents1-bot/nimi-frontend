import { type Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/patterns/Hero";
import { Tag } from "@/components/primitives/Tag";
import { clientEnv } from "@/lib/env";
import { images } from "@/lib/images";

import { CalBookingButton } from "./CalBookingButton";

export const metadata: Metadata = {
  title: "Book a paid consultation",
  description:
    "Book a focused, paid consultation about your event — 30 minutes for quick direction, 60 minutes for a full planning conversation. Payment is collected at booking via Stripe.",
};

interface ConsultationOption {
  durationMinutes: 30 | 60;
  priceLabel: string;
  title: string;
  description: string;
  bullets: ReadonlyArray<string>;
  flagship?: boolean;
  envSlug: string;
}

const options: ReadonlyArray<ConsultationOption> = [
  {
    durationMinutes: 30,
    priceLabel: "£10",
    title: "30-minute Quick Consultation",
    description:
      "A focused conversation for early-stage planning, quick direction, or a single decision you need help thinking through.",
    bullets: [
      "Quick enquiry and direction",
      "Best for events at an early stage",
      "We'll point you to the right tier and lead time",
    ],
    envSlug: clientEnv.NEXT_PUBLIC_CAL_EVENT_30,
  },
  {
    durationMinutes: 60,
    priceLabel: "£30",
    title: "60-minute Full Planning Call",
    description:
      "A full planning conversation — we go deep on concept, scope and timeline, and follow up with a written quote within two working days.",
    bullets: [
      "Full planning + concept discussion",
      "Quote follow-up within two working days",
      "Counts toward your event deposit if you book",
    ],
    flagship: true,
    envSlug: clientEnv.NEXT_PUBLIC_CAL_EVENT_60,
  },
];

export default function ConsultationPage() {
  const username = clientEnv.NEXT_PUBLIC_CAL_USERNAME;
  const isConfigured = Boolean(username);

  return (
    <>
      <Hero
        height="short"
        eyebrow="Event planning"
        title="Book a consultation."
        lede="Paid, focused, scheduled. The fastest way to turn an idea into a plan."
        imageUrl={images.hero.events}
      />

      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">Two ways to book</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Choose your duration.
          </h2>
          <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
            All consultations are paid up-front and confirmed instantly. Payment is collected
            securely via Stripe at the time of booking. Your slot is held the moment payment
            clears — no back-and-forth, no missed calls.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {options.map((opt) => (
              <article
                key={opt.durationMinutes}
                className={`flex flex-col border bg-cream-50 p-6 transition-shadow hover:shadow-md md:p-8 ${
                  opt.flagship
                    ? "border-t-4 border-cream-200 border-t-maroon-600"
                    : "border-cream-200"
                }`}
              >
                <p className="eyebrow mb-3">
                  {opt.durationMinutes} minutes · {opt.priceLabel}
                </p>
                <h3 className="m-0 mb-3 font-display text-2xl font-medium text-maroon-600">
                  {opt.title}
                </h3>
                <p className="mb-4 font-sans text-base text-neutral-700">{opt.description}</p>
                <ul className="m-0 mb-6 list-disc space-y-1 pl-5 font-sans text-sm text-neutral-700">
                  {opt.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <CalBookingButton
                    username={username}
                    eventSlug={opt.envSlug}
                    variant={opt.flagship ? "primary" : "secondary"}
                  >
                    Book {opt.priceLabel} · {opt.durationMinutes} min
                  </CalBookingButton>
                </div>
              </article>
            ))}
          </div>

          {!isConfigured ? (
            <div className="mt-10 border border-orange-200 bg-orange-100/40 p-6">
              <p className="eyebrow mb-2">Booking not yet configured</p>
              <p className="m-0 max-w-prose font-sans text-base text-neutral-700">
                Online consultation booking is being set up. In the meantime, you can{" "}
                <Link
                  href="/events/booking"
                  className="text-orange-700 underline underline-offset-4"
                >
                  send a free enquiry
                </Link>{" "}
                or{" "}
                <Link
                  href="/contact"
                  className="text-orange-700 underline underline-offset-4"
                >
                  get in touch directly
                </Link>{" "}
                — we'll respond within one working day.
              </p>
            </div>
          ) : null}

          <p className="mt-10 max-w-prose font-sans text-sm text-neutral-500">
            Need to reschedule or cancel? Use the link in your booking confirmation email — it
            updates the calendar instantly. Refunds for paid consultations are handled on a
            case-by-case basis; see our{" "}
            <Link href="/terms" className="text-orange-600 underline underline-offset-4">
              terms
            </Link>{" "}
            for details.
          </p>
        </div>
      </section>

      <section className="bg-cream-100 px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-start">
            <div>
              <p className="eyebrow mb-3">What to expect</p>
              <h2 className="m-0 mb-4 max-w-2xl font-display text-3xl font-medium text-maroon-600">
                Considered, not casual.
              </h2>
              <ol className="m-0 mb-6 max-w-prose list-decimal space-y-2 pl-5 font-sans text-base text-neutral-700">
                <li>Pick a duration and a slot — payment confirms the booking instantly.</li>
                <li>You'll receive a calendar invite and a short pre-call form to fill in.</li>
                <li>
                  We meet (video or phone) and walk through your event, scope, vibe and decisions.
                </li>
                <li>
                  Within two working days for the 60-min call, you'll receive a written concept
                  and quote.
                </li>
              </ol>
            </div>

            <aside className="border border-cream-200 bg-cream-50 p-6">
              <p className="eyebrow mb-3">Already know what you want?</p>
              <p className="m-0 mb-4 font-sans text-base text-neutral-700">
                If you'd rather skip the call and go straight to written enquiry, that's fine too.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/events/booking"
                  className="inline-flex items-center justify-center border border-maroon-600 px-5 py-2.5 font-sans text-sm font-medium uppercase tracking-[0.18em] text-maroon-700 hover:bg-cream-100"
                >
                  Free enquiry
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center px-5 py-2.5 font-sans text-sm font-medium uppercase tracking-[0.18em] text-orange-700 hover:underline"
                >
                  Browse tiers
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag variant="orange">Reply within 1 working day</Tag>
                <Tag>Free</Tag>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
