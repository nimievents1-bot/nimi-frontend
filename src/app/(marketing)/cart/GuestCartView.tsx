"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { emitCartUpdated } from "@/components/patterns/CartIndicator";
import {
  GUEST_CART_UPDATED_EVENT,
  readGuestCart,
  removeFromGuestCart,
  setGuestCartQuantity,
  type GuestCartLine,
} from "@/lib/guestCart";

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * Guest-cart surface on the `/cart` page.
 *
 * Renders the localStorage cart for anonymous visitors so they can
 * review their picks, change quantities, and remove lines without
 * signing in. The only auth gate is the "Sign in & check out" CTA at
 * the bottom — clicking it bounces to `/login?next=/cart`, after
 * which the page (now authed) auto-syncs the localStorage cart into
 * the server cart and shows the full checkout flow.
 *
 * Why a client component:
 *   - localStorage is browser-only, so the cart contents can't be
 *     fetched server-side.
 *   - We listen on the cart-updated event so quantity edits in this
 *     view immediately update the header badge and the summary.
 */
export function GuestCartView({ minimumMinor = 2500 }: { minimumMinor?: number }) {
  const router = useRouter();
  const [lines, setLines] = useState<GuestCartLine[]>([]);
  // `hydrated` distinguishes "we haven't loaded yet" from "we
  // loaded and the cart is empty" — important on the cold render
  // before useEffect runs so we don't flash an empty state.
  const [hydrated, setHydrated] = useState(false);

  // Initial hydrate from localStorage + listen for changes (e.g. when
  // the customer adds another item in another tab, or removes one
  // from this view). useSyncExternalStore would be slightly cleaner
  // but the plain effect is fine for a single store.
  useEffect(() => {
    const sync = () => setLines(readGuestCart());
    sync();
    setHydrated(true);
    window.addEventListener(GUEST_CART_UPDATED_EVENT, sync);
    // Cross-tab updates fire `storage` too.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(GUEST_CART_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const summary = useMemo(() => {
    const subtotalMinor = lines.reduce(
      (n, l) => n + l.quantity * l.unitPriceMinor,
      0,
    );
    const currency = lines[0]?.currency ?? "gbp";
    const meetsMinimum = subtotalMinor >= minimumMinor;
    return { subtotalMinor, currency, meetsMinimum };
  }, [lines]);

  const onChangeQty = (pastryItemId: string, next: number) => {
    setGuestCartQuantity(pastryItemId, next);
    emitCartUpdated();
  };

  const onRemove = (pastryItemId: string) => {
    removeFromGuestCart(pastryItemId);
    emitCartUpdated();
  };

  const onSignInToCheckout = () => {
    // The cart page itself runs the sync from localStorage → server
    // when it sees the visitor land back with a session cookie, so
    // we just bounce through /login with /cart as the destination.
    router.push("/login?next=/cart");
  };

  if (!hydrated) {
    return (
      <p className="font-sans text-sm text-neutral-500">Loading your cart…</p>
    );
  }

  if (lines.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      {/* Lines + per-line actions */}
      <section>
        <ul className="m-0 list-none space-y-4 p-0">
          {lines.map((line) => (
            <li
              key={line.pastryItemId}
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
                    {fmt(line.unitPriceMinor * line.quantity, line.currency)}
                  </span>
                </div>
                {line.description ? (
                  <p className="mt-1 max-w-prose font-sans text-sm text-neutral-700">
                    {line.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center border border-cream-200 bg-cream-50">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => onChangeQty(line.pastryItemId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="px-3 py-2 font-display text-base text-maroon-700 hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="min-w-[2.5rem] text-center font-sans text-sm font-semibold text-neutral-800">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => onChangeQty(line.pastryItemId, line.quantity + 1)}
                      className="px-3 py-2 font-display text-base text-maroon-700 hover:bg-cream-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-sans text-xs text-neutral-500">
                    {fmt(line.unitPriceMinor, line.currency)} each
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(line.pastryItemId)}
                    className="font-display text-sm italic text-orange-700 underline underline-offset-4 hover:text-orange-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 font-sans text-xs italic text-neutral-500">
          Prices and availability are re-checked the moment you sign in to
          finish your order.
        </p>
      </section>

      {/* Summary + sign-in CTA */}
      <aside className="space-y-6">
        <section className="border border-cream-200 bg-paper p-6">
          <h2 className="m-0 mb-4 font-display text-2xl text-maroon-600">
            Order summary
          </h2>
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-2 font-sans text-sm">
            <dt className="text-neutral-700">Subtotal</dt>
            <dd className="text-right font-medium text-neutral-900">
              {fmt(summary.subtotalMinor, summary.currency)}
            </dd>
            <dt className="border-t border-cream-200 pt-3 font-medium text-maroon-700">
              Total before sign-in
            </dt>
            <dd className="border-t border-cream-200 pt-3 text-right font-display text-2xl font-medium text-maroon-700">
              {fmt(summary.subtotalMinor, summary.currency)}
            </dd>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Tag variant={summary.meetsMinimum ? "success" : "orange"}>
              {summary.meetsMinimum
                ? `Meets £${(minimumMinor / 100).toFixed(2)} minimum`
                : `£${((minimumMinor - summary.subtotalMinor) / 100).toFixed(2)} below minimum`}
            </Tag>
          </div>
          <p className="mt-4 font-sans text-xs text-neutral-500">
            Indulgence Credits and your saved delivery address are applied
            once you sign in.
          </p>
        </section>

        <section className="border border-cream-200 bg-paper p-6">
          <h2 className="m-0 mb-2 font-display text-2xl text-maroon-600">
            Ready to check out?
          </h2>
          <p className="mb-4 max-w-prose font-sans text-sm text-neutral-700">
            Sign in to apply your delivery address and any Indulgence
            Credits, then finish your order. Your cart travels with you.
          </p>
          <Alert variant="info" className="mb-4">
            <strong className="font-display text-base text-maroon-700">
              New here?
            </strong>{" "}
            <span className="font-sans text-sm text-neutral-700">
              Creating an account takes about thirty seconds.{" "}
              <Link
                href="/signup?next=/cart"
                className="text-orange-700 underline underline-offset-4"
              >
                Sign up instead
              </Link>
              .
            </span>
          </Alert>
          <button
            type="button"
            onClick={onSignInToCheckout}
            disabled={!summary.meetsMinimum}
            className="w-full bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 transition-colors hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign in & check out
          </button>
          {!summary.meetsMinimum ? (
            <p className="mt-3 text-center font-sans text-xs text-neutral-500">
              Add a few more items to reach the £{(minimumMinor / 100).toFixed(2)} minimum before checkout.
            </p>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
