import Link from "next/link";

/**
 * Not-found page scoped to the `(account)` route group.
 *
 * Without this file, Next.js bubbles up to the root `app/not-found.tsx`
 * — which renders its own `<Header />` from the marketing pattern set.
 * The account layout (which persists across not-found rendering)
 * already paints its own `<header>` chrome, so we'd end up with two
 * brand bars stacked on top of each other (the "double header" bug we
 * hit on the gift-order detail when an order belongs to a different
 * user or was placed as a guest).
 *
 * Keeping this not-found minimal — just inner content — lets the
 * account layout's chrome stay the single header on the page.
 */
export default function AccountNotFound() {
  return (
    <div className="mx-auto max-w-prose py-16 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
        We couldn&rsquo;t find that order.
      </h1>
      <p className="mb-8 font-sans text-base text-neutral-700">
        The reference may be old, the order may belong to a different account, or it may have
        been placed as a guest — guest orders are tracked by the receipt email, not under your
        account. Check the original confirmation email for the link.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
        >
          All your orders
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center border border-cream-200 bg-cream-100 px-6 py-3 font-display text-lg italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
