import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

import { CartActions } from "./CartActions";
import { CheckoutForm } from "./CheckoutForm";
import { GuestCartSync } from "./GuestCartSync";
import { GuestCartView } from "./GuestCartView";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

interface CartLine {
  itemId: string;
  cartItemId: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unitPriceMinor: number;
  currency: string;
  quantity: number;
  lineTotalMinor: number;
  available: boolean;
  // ---- Per-item rule fields surfaced by the cart API ----
  /** Minimum order quantity for this item (1 = no minimum). */
  minQuantity: number;
  /** Kitchen daily cap (null = no cap). */
  batchLimit: number | null;
  /** Units already committed for today (other customers' open orders). */
  bookedToday: number;
  /** `quantity >= minQuantity` — checkout is blocked when any line is false. */
  meetsMinimum: boolean;
  /** `bookedToday + quantity <= batchLimit` (true if no cap). */
  withinBatch: boolean;
}

interface CartView {
  lines: CartLine[];
  subtotalMinor: number;
  currency: string;
  creditBalanceMinor: number;
  applicableCreditMinor: number;
  payableMinor: number;
  meetsMinimum: boolean;
  /** Every cart line clears its per-item minimum order quantity. */
  meetsAllItemMinimums: boolean;
  /** Every cart line fits inside its item's daily batch cap. */
  withinAllBatchLimits: boolean;
}

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Anonymous visitors are welcome on /cart now — they can review the
  // localStorage guest cart, change quantities, and only need to sign
  // in at the moment they want to check out. `getSessionUser` returns
  // null cleanly rather than throwing a redirect, so the same page
  // serves both audiences.
  const sessionUser = await getSessionUser();
  const { status } = await searchParams;

  // ------------------------------------------------------------------
  // Anonymous path — render the localStorage cart client-side.
  // ------------------------------------------------------------------
  if (!sessionUser) {
    return (
      // Section wrapper mirrors every other marketing page (catering,
      // cravings, gifting, etc.) — gives the page proper top breathing
      // room under the sticky header, the page gutter on phones, and
      // a centred max-width column on desktop. Without it the
      // "THE INDULGENCE CLUB" eyebrow butted right against the chrome
      // on mobile.
      <section className="px-page-gutter py-section-y">
        <div className="mx-auto max-w-page">
          <p className="eyebrow mb-2">The Indulgence Club</p>
          <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
            Your cart
          </h1>
          {status === "cancelled" ? (
            <div className="mb-6 border-l-4 border-orange-500 bg-cream-100 px-6 py-4">
              <p className="m-0 font-sans text-sm text-neutral-700">
                Checkout was cancelled — your cart is exactly as you left it.
              </p>
            </div>
          ) : null}
          <GuestCartView />
        </div>
      </section>
    );
  }

  // ------------------------------------------------------------------
  // Authenticated path (below) — existing server-rendered cart.
  // ------------------------------------------------------------------
  const cookieHeader = (await cookies()).toString();

  // Load cart and customer's saved profile in parallel. The profile
  // is purely a UI nicety — pre-fills the checkout form so a returning
  // customer doesn't retype name/address. Failing the profile fetch
  // doesn't block the cart; the form just opens empty.
  interface ProfileDefaults {
    name: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    addressCity: string | null;
    addressPostcode: string | null;
    addressCountry: string | null;
  }
  const [viewResult, profileResult] = await Promise.allSettled([
    apiFetch<CartView>("/pastry-cart", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
    apiFetch<ProfileDefaults>("/profile", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const view: CartView | null = viewResult.status === "fulfilled" ? viewResult.value : null;
  const error: string | null =
    viewResult.status === "rejected"
      ? viewResult.reason instanceof Error
        ? viewResult.reason.message
        : "Failed to load your cart."
      : null;
  const profile: ProfileDefaults | null =
    profileResult.status === "fulfilled" ? profileResult.value : null;

  const empty = !view || view.lines.length === 0;

  return (
    // Same section wrapper as the anonymous path above — keeps the
    // page in lockstep with the rest of the marketing layout
    // (gutter on phones, centred column on desktop, proper top
    // padding under the sticky header).
    <section className="px-page-gutter py-section-y">
      <div className="mx-auto max-w-page">
      {/* If the customer just signed in with items in their localStorage
          guest cart, this side-effect component merges them into the
          server cart and refreshes the page. No UI — invisible by
          design. The next render of this server component picks up
          the merged contents from `apiFetch("/pastry-cart")` above. */}
      <GuestCartSync />

      <p className="eyebrow mb-2">The Indulgence Club</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Your cart
      </h1>

      {status === "cancelled" ? (
        <div className="mb-6 border-l-4 border-orange-500 bg-cream-100 px-6 py-4">
          <p className="m-0 font-sans text-sm text-neutral-700">
            Checkout was cancelled — your cart is exactly as you left it.
          </p>
        </div>
      ) : null}

      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      {empty ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 mb-4 font-sans text-base text-neutral-700">
            Your cart is empty.
          </p>
          <Link
            href="/cravings"
            className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
          >
            Browse the menu
          </Link>
        </div>
      ) : view ? (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Lines + actions */}
          <section>
            <ul className="m-0 list-none space-y-4 p-0">
              {view.lines.map((line) => (
                <li
                  key={line.cartItemId}
                  className="flex flex-wrap items-start gap-4 border border-cream-200 bg-paper p-4"
                >
                  <div
                    aria-hidden
                    className="aspect-square w-24 flex-none bg-gradient-to-br from-orange-300 to-maroon-700"
                    style={
                      line.imageUrl
                        ? {
                            backgroundImage: `url("${line.imageUrl}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="m-0 font-display text-xl text-maroon-600">
                        {line.name}
                      </h2>
                      <span className="font-display text-base text-orange-700">
                        {fmt(line.lineTotalMinor, line.currency)}
                      </span>
                    </div>
                    {line.description ? (
                      <p className="mt-1 max-w-prose font-sans text-sm text-neutral-700">
                        {line.description}
                      </p>
                    ) : null}
                    {!line.available ? (
                      <p className="mt-2 font-sans text-xs text-semantic-danger">
                        No longer available — please remove this item.
                      </p>
                    ) : null}
                    {/*
                      Per-line rule warnings. We render BOTH when a line
                      violates BOTH (rare) so the customer sees the full
                      picture without having to bump the quantity twice.
                      `meetsMinimum` blocks checkout outright; the
                      `withinBatch` line also blocks but surfaces a
                      remediation hint ("you can keep X for today").
                    */}
                    {!line.meetsMinimum ? (
                      <p className="mt-2 font-sans text-xs text-semantic-danger">
                        Minimum order is {line.minQuantity} — please increase the quantity to continue.
                      </p>
                    ) : null}
                    {!line.withinBatch && line.batchLimit !== null ? (
                      <p className="mt-2 font-sans text-xs text-semantic-danger">
                        {(() => {
                          const left = Math.max(0, line.batchLimit - line.bookedToday);
                          return left === 0
                            ? "Fully booked for today. Try again tomorrow or remove this line."
                            : `Only ${left} left for today — please drop to ${left} or fewer.`;
                        })()}
                      </p>
                    ) : line.minQuantity > 1 || line.batchLimit !== null ? (
                      // When the line is healthy, show a quiet hint so the
                      // customer can see the rules without being told they
                      // broke one.
                      <p className="mt-2 font-sans text-xs italic text-neutral-500">
                        {line.minQuantity > 1 ? `Minimum ${line.minQuantity} per order` : null}
                        {line.minQuantity > 1 && line.batchLimit !== null ? " · " : null}
                        {line.batchLimit !== null
                          ? `${Math.max(0, line.batchLimit - line.bookedToday)} left for today`
                          : null}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <CartActions
                        cartItemId={line.cartItemId}
                        quantity={line.quantity}
                        unitPriceMinor={line.unitPriceMinor}
                        currency={line.currency}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 font-sans text-xs italic text-neutral-500">
              Prices update live — what you see here is what you&rsquo;ll be charged.
            </p>
          </section>

          {/* Summary + checkout form */}
          <aside className="space-y-6">
            <section className="border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-4 font-display text-2xl text-maroon-600">
                Order summary
              </h2>
              <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-2 font-sans text-sm">
                <dt className="text-neutral-700">Subtotal</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {fmt(view.subtotalMinor, view.currency)}
                </dd>
                <dt className="text-neutral-700">Indulgence Credits applied</dt>
                <dd className="text-right font-medium text-orange-700">
                  −{fmt(view.applicableCreditMinor, view.currency)}
                </dd>
                <dt className="border-t border-cream-200 pt-3 font-medium text-maroon-700">
                  Payable today
                </dt>
                <dd className="border-t border-cream-200 pt-3 text-right font-display text-2xl font-medium text-maroon-700">
                  {fmt(view.payableMinor, view.currency)}
                </dd>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Tag variant={view.meetsMinimum ? "success" : "orange"}>
                  {view.meetsMinimum
                    ? "Meets £25 minimum"
                    : `£${((2500 - view.subtotalMinor) / 100).toFixed(2)} below minimum`}
                </Tag>
                {/*
                  Per-item-minimum and batch-limit gates surface here
                  too so the summary card paints a complete picture of
                  what's blocking checkout. Both render in orange to
                  match the £25 below-minimum tag's tone — the cart
                  is "not ready" rather than "broken".
                */}
                {!view.meetsAllItemMinimums ? (
                  <Tag variant="orange">Item below minimum quantity</Tag>
                ) : null}
                {!view.withinAllBatchLimits ? (
                  <Tag variant="orange">Over today&rsquo;s capacity</Tag>
                ) : null}
                {view.creditBalanceMinor > 0 ? (
                  <Tag>
                    Credit balance {fmt(view.creditBalanceMinor, view.currency)}
                  </Tag>
                ) : null}
              </div>
            </section>

            <section className="border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-4 font-display text-2xl text-maroon-600">
                Delivery details
              </h2>
              <CheckoutForm
                meetsMinimum={view.meetsMinimum}
                anyUnavailable={view.lines.some((l) => !l.available)}
                meetsAllItemMinimums={view.meetsAllItemMinimums}
                withinAllBatchLimits={view.withinAllBatchLimits}
                defaults={
                  profile
                    ? {
                        name: profile.name ?? "",
                        phone: profile.phone ?? "",
                        line1: profile.addressLine1 ?? "",
                        line2: profile.addressLine2 ?? "",
                        city: profile.addressCity ?? "",
                        postcode: profile.addressPostcode ?? "",
                        country: profile.addressCountry ?? "GB",
                      }
                    : undefined
                }
              />
            </section>
          </aside>
        </div>
      ) : null}
      </div>
    </section>
  );
}
