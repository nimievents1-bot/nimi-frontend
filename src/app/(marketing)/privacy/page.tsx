import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Nimi Events handles your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Legal"
        title="Privacy policy."
        lede="The short version: we collect what we need, we keep it secure, and we don't sell it."
        imageUrl={images.hero.privacy}
      />
      <section className="px-page-gutter section-tight">
        <article className="prose prose-stone mx-auto max-w-prose font-sans text-base leading-relaxed text-neutral-800">
          <p className="font-display text-xl italic text-neutral-700">
            Last updated — placeholder. The final policy is provided by legal counsel before launch.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">
            What we collect
          </h2>
          <p>
            Account details (name, email, phone), enquiry contents, booking details, and order
            history. If you subscribe to Pastry Cravings, we also store the subscription state and
            credit ledger entries. Payment information is processed by Stripe and never stored by
            us.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">
            How we use it
          </h2>
          <p>
            To reply to your enquiries, fulfil orders and bookings, manage your subscription, and
            send the small set of operational emails associated with each (confirmations, receipts,
            renewals, status updates). We send marketing emails only if you opt in via the
            newsletter, and you can unsubscribe at any time.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">Your rights</h2>
          <p>
            Under UK GDPR you have rights of access, rectification, erasure, restriction,
            portability and objection. Email us at{" "}
            <a className="text-orange-600 underline underline-offset-4" href="mailto:hello@nimievents.co.uk">
              hello@nimievents.co.uk
            </a>{" "}
            and we&rsquo;ll respond within one calendar month.
          </p>
        </article>
      </section>
    </>
  );
}
