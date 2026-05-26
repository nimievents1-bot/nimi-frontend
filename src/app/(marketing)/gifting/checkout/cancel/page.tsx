import { type Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

/**
 * Gifting checkout cancel page — landed on when the customer abandons
 * the Stripe Checkout session.
 *
 * Uses the plain marketing wrapper (gutter + section padding) so the
 * global `<Header>` from the (marketing) layout sits cleanly above the
 * content. We do NOT use `<AuthShell>` here — that would render its
 * own brand chrome and stack a second masthead on top of the marketing
 * header, the same double-header bug we fixed on the success page.
 */
export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-page-gutter py-section-y">
      <p className="eyebrow mb-3">Order</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Checkout cancelled.
      </h1>
      <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
        No payment has been taken. You can pick up where you left off any time.
      </p>

      <Alert variant="info">
        {ref ? `Reference ${ref}. ` : null}If you ran into a problem during checkout, write to{" "}
        <a href="mailto:hello@nimievents.com" className="underline">
          hello@nimievents.com
        </a>{" "}
        and we&rsquo;ll help you complete the order.
      </Alert>

      <div className="mt-6">
        <Link
          href="/gifting"
          className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
        >
          Back to gifting
        </Link>
      </div>
    </div>
  );
}
