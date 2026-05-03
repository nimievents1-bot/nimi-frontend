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
            Gift orders are bespoke and produced once final designs are approved. Production time
            is six to twelve weeks depending on complexity. Cancellations after design approval
            may be subject to a fee.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">
            The Nimi Indulgence Club
          </h2>
          <p>
            Indulgence Club subscriptions are monthly recurring with a three-month minimum
            commitment. After the minimum term, you can cancel at any time via your account;
            cancellation stops future billing only and does not refund credits already issued.
          </p>
          <p>
            Each month&rsquo;s Indulgence Credits are valid for three months from issue. Credits
            are prepaid value and are not refundable, transferable, or redeemable for cash. The
            minimum pastry order is £25. Credit balances accrue up to a £1,000 rolling cap.
          </p>
          <p>
            Surprise pastries, bonus drops, and birthday gestures are occasional perks, not
            guaranteed entitlements. Priority access to limited drops is the principal value of
            membership.
          </p>
        </article>
      </section>
    </>
  );
}
