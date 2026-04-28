import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "The terms governing your use of nimievents.co.uk and the services we offer.",
};

export default function TermsPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Legal"
        title="Terms & conditions."
        lede="The boring necessary stuff. We've kept it as plain as we can."
        imageUrl={images.hero.terms}
      />
      <section className="px-page-gutter section-tight">
        <article className="mx-auto max-w-prose font-sans text-base leading-relaxed text-neutral-800">
          <p className="font-display text-xl italic text-neutral-700">
            Last updated — placeholder. Final wording supplied by legal counsel before launch.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">Bookings</h2>
          <p>
            All catering and event bookings are provisional until a deposit is received. Deposits
            are non-refundable except in the cases set out in our cancellation policy.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">Gifting</h2>
          <p>
            Gift orders are bespoke and produced once final designs are approved. Lead time is six
            to ten weeks. Cancellations after design approval may be subject to a fee.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">Subscriptions</h2>
          <p>
            Pastry Cravings subscriptions are monthly recurring. Pause or cancel at any time via
            your account. Credit balances accrue up to a £1,000 cap and remain redeemable for 12
            months after cancellation.
          </p>
        </article>
      </section>
    </>
  );
}
