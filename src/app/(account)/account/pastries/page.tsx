import { type Metadata } from "next";
import Link from "next/link";

import { PastryMenuGrid, type PastryMenuItem } from "@/components/patterns/PastryMenuGrid";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Pastries",
  robots: { index: false, follow: false },
};

/**
 * Account-context pastry menu.
 *
 * Reached from the dashboard's "Cravings" card. Shows the customer
 * the same pastry grid that the public `/pastries` page uses, but
 * lives inside the account sidebar layout and surfaces a prominent
 * link to their subscription dashboard (`/account/subscription`).
 *
 * Why the card lands here and not on `/account/subscription`:
 *   The operator's intent is "see what I can order now, then drill
 *   into my subscription details if I want to". Most customer trips
 *   into Cravings start with "what's available today" — landing on
 *   plan management first buries the lede. This page makes the menu
 *   the primary content and the subscription the secondary action.
 */
export default async function AccountPastriesPage() {
  // Sourced from the same public endpoint the marketing site uses —
  // the menu doesn't change between authed and anonymous reads.
  // We're already inside the account layout (which has its own
  // `requireSessionUser` gate), so `isAuthed` is implicitly true and
  // `AddToCartButton` will write to the server cart rather than
  // localStorage.
  let items: PastryMenuItem[] = [];
  try {
    const data = await apiFetch<{ rows: PastryMenuItem[] }>("/pastries", {
      method: "GET",
      cache: "no-store",
    });
    items = data.rows;
  } catch {
    // Best-effort — empty state will render below.
  }

  return (
    <>
      <p className="eyebrow mb-2">The Indulgence Club</p>
      <h1 className="m-0 mb-2 font-display text-5xl font-medium text-maroon-600">
        Pastries
      </h1>
      <p className="mb-6 max-w-prose font-sans text-base text-neutral-700">
        Browse what&rsquo;s on the kitchen counter today and add to your cart.
        Indulgence Credits apply automatically at checkout.
      </p>

      {/*
        Account-level secondary actions. The subscription link is the
        primary one — most customers visiting this page want to see
        the menu AND know their credit balance is healthy. The "Cart"
        deep link is convenience: a one-tap path to checkout once
        they've filled the cart.
      */}
      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          href="/account/subscription"
          className="inline-flex items-center justify-center bg-maroon-600 px-5 py-2.5 font-display text-base italic text-cream-50 hover:bg-maroon-700"
        >
          View my subscription
        </Link>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center border border-cream-200 bg-cream-100 px-5 py-2.5 font-display text-base italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100"
        >
          Go to my cart
        </Link>
      </div>

      <PastryMenuGrid
        items={items}
        isAuthed
        emptyMessage="No items available right now — fresh batches drop regularly. Check back shortly."
      />

      {items.length > 0 ? (
        <p className="mt-6 max-w-prose font-sans text-xs italic text-neutral-500">
          Minimum order £25 per drop. Indulgence Credits apply automatically at
          checkout.
        </p>
      ) : null}
    </>
  );
}
