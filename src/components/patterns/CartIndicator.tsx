"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/cn";
import { readGuestCartCount } from "@/lib/guestCart";

/**
 * Header-mounted cart icon with a live count badge.
 *
 * Why this exists:
 *   - Before this component, the "Add to cart" action succeeded server-side
 *     but nothing in the chrome reflected it — users had no way of seeing
 *     that their click did anything, and no obvious path to /cart from
 *     anywhere on the marketing site. This component closes both gaps.
 *
 * Auth model:
 *   - Authed visitors: count comes from `/pastry-cart` (JWT-guarded
 *     server cart).
 *   - Anonymous visitors: count comes from `localStorage` via the
 *     guest-cart helpers. The icon links straight to `/cart` either
 *     way — the cart page itself knows how to render the guest cart
 *     and prompts for sign-in only at checkout. No more pre-auth
 *     bounce to /login the moment someone adds an item.
 *
 * Live updates:
 *   - On mount we fetch the cart once.
 *   - We listen for a window-level `nimi:cart:updated` event so any
 *     successful add / remove / clear in the same tab refreshes the
 *     count without a page reload.
 *   - We re-fetch on the `focus` event too, so opening another tab,
 *     adding an item there, and switching back keeps the badge honest.
 *
 * Accessibility:
 *   - Renders a single anchor with a semantic aria-label that includes
 *     the live count ("Open cart (3 items)").
 *   - The badge itself is decorative; screen readers get the count
 *     through the label.
 */

interface CartLine {
  quantity: number;
}

interface CartView {
  lines?: CartLine[];
}

interface Props {
  onDark?: boolean;
  isAuthed: boolean;
}

const CART_UPDATED_EVENT = "nimi:cart:updated";

export function CartIndicator({ onDark = false, isAuthed }: Props) {
  // null = unknown (don't render a badge until first fetch completes)
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthed) {
      // Anonymous visitors: source of truth is localStorage. Reads
      // are SSR-safe (return 0 server-side) so we don't need an
      // extra `typeof window` check here.
      setCount(readGuestCartCount());
      return;
    }
    try {
      const view = await apiFetch<CartView>("/pastry-cart", { method: "GET" });
      const total = (view.lines ?? []).reduce((acc, line) => acc + (line.quantity || 0), 0);
      setCount(total);
    } catch {
      // Network blip or 401 (session expired). Don't surface an error in
      // the chrome — just clear the badge. Cart page itself will handle
      // the auth bounce when the user clicks through.
      setCount(null);
    }
  }, [isAuthed]);

  useEffect(() => {
    void refresh();

    const onUpdated = () => void refresh();
    const onFocus = () => void refresh();
    window.addEventListener(CART_UPDATED_EVENT, onUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  // Anonymous visitors can open the cart too — the cart page now
  // hydrates from localStorage and prompts for sign-in only at the
  // moment of checkout. No more `?next=/login` bounce on the cart
  // icon itself.
  const href = "/cart";
  const showBadge = (count ?? 0) > 0;
  const labelCount = count ?? 0;
  const ariaLabel =
    labelCount === 1
      ? "Open cart (1 item)"
      : `Open cart (${labelCount} items)`;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group relative inline-flex h-10 w-10 items-center justify-center transition-colors duration-fast ease-brand",
        onDark
          ? "text-cream-50 hover:text-orange-300"
          : "text-maroon-700 hover:text-orange-700",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/*
         * Hand-tuned shopping-bag glyph at 24×24.
         * Matches the editorial weight of the rest of the chrome —
         * thin strokes, gentle curve at the top to suggest a paper bag
         * rather than a hardware-store basket.
         */}
        <path d="M5.25 8h13.5l-1 11a2 2 0 0 1-2 1.8h-7.5a2 2 0 0 1-2-1.8L5.25 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {showBadge ? (
        <span
          aria-hidden="true"
          className={cn(
            // Square chip — keeps with the brand's no-rounded-corners
            // rule. min-w + px-1 lets a 2-digit count breathe.
            "absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center px-1 font-sans text-[0.6875rem] font-semibold leading-none",
            onDark
              ? "bg-cream-50 text-maroon-700"
              : "bg-maroon-600 text-cream-50",
          )}
        >
          {labelCount > 99 ? "99+" : labelCount}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Emit from any component that mutates the cart so the header badge
 * refreshes immediately without a navigation. Cheap to call — the
 * listener no-ops when no indicator is mounted (anonymous pages).
 */
export function emitCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
