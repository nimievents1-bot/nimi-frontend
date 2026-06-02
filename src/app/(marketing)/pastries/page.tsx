import { type Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/patterns/Hero";
import { PastryMenuGrid, type PastryMenuItem } from "@/components/patterns/PastryMenuGrid";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { siteImage } from "@/lib/siteImages";

export const metadata: Metadata = {
  title: "Pastries",
  description:
    "The Nimi pastry menu — small batches, made fresh, ready to collect or dispatched cold-chain across the UK. Browse and order without committing to a subscription.",
};

/**
 * Public pastry shop — every pastry the kitchen is currently selling,
 * with one-tap "Add to cart" actions.
 *
 * Why this lives separately from `/cravings`:
 *   `/cravings` is the Indulgence Club subscription pitch — plans,
 *   benefits, "why members stay" — with the pastry menu shown as
 *   social proof of "what credits buy". A shopper who wants to buy a
 *   pastry once, without committing to a monthly plan, deserves a
 *   surface that isn't trying to sell them on subscription first.
 *
 * This page renders the SAME `PastryMenuGrid` that the cravings page
 * uses — the component is shared so any card-design change ripples
 * to both. The grid is purely a server-rendered list of items; the
 * "Add to cart" pill (a client island) handles both anonymous
 * (localStorage) and authenticated (server cart) flows transparently.
 */
export default async function PastriesPage() {
  // Read items + session in parallel — session matters only for the
  // AddToCartButton client island that runs inside the grid, but it
  // costs nothing to fetch here and saves a waterfall.
  const [pastriesResult, sessionUser] = await Promise.allSettled([
    apiFetch<{ rows: PastryMenuItem[] }>("/pastries", {
      method: "GET",
      cache: "no-store",
    }),
    getSessionUser(),
  ]);

  const pastries =
    pastriesResult.status === "fulfilled" ? pastriesResult.value.rows : [];
  const isAuthed =
    sessionUser.status === "fulfilled" && Boolean(sessionUser.value);

  return (
    <>
      <Hero
        eyebrow="The kitchen"
        title="Pastries."
        lede="Small batches, made fresh, ready to collect or dispatched cold-chain. Order what you'd like — no subscription required."
        imageUrl={await siteImage("hero.cravings")}
        height="short"
      />

      {/*
        Pastry grid. Wrapped in the marketing section padding so it
        sits flush with every other content section on the marketing
        surface. We don't repeat the "Indulgence Club" framing here —
        that's the `/cravings` page's job; this surface is for
        one-off shoppers.
      */}
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-3">The menu</p>
          <h2 className="m-0 mb-4 max-w-3xl font-display text-4xl font-medium text-maroon-600">
            Made fresh, served warm.
          </h2>
          <p className="mb-10 max-w-prose font-sans text-lg text-neutral-700">
            Browse the current menu and add what catches your eye. Minimum order
            £25 per drop.{" "}
            <Link
              href="/cravings"
              className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
            >
              Or join the Indulgence Club
            </Link>{" "}
            to convert a monthly indulgence allowance into pastries with
            priority access and surprise drops.
          </p>

          <PastryMenuGrid items={pastries} isAuthed={isAuthed} />

          <p className="mt-6 max-w-prose font-sans text-xs italic text-neutral-500">
            Menu availability rotates seasonally and based on batch capacity.
            Lead times vary by item — your cart will show what&rsquo;s ready
            when.
          </p>
        </div>
      </section>
    </>
  );
}
