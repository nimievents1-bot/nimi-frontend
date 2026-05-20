"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { emitCartUpdated } from "@/components/patterns/CartIndicator";
import { ApiError, apiFetch } from "@/lib/api";
import { addToGuestCart } from "@/lib/guestCart";

interface AddToCartButtonProps {
  pastryItemId: string;
  itemName: string;
  /**
   * Whether the current visitor is signed in. Authenticated visitors
   * write to the server cart via the API; anonymous visitors write to
   * the localStorage guest cart. Either way the click feels the same
   * and the header indicator updates immediately.
   */
  isAuthed: boolean;
  /**
   * Item snapshot used when writing to the guest cart. Only required
   * for the anonymous path — the API doesn't need this for authed
   * users because the server already owns the catalog. Keeping these
   * optional means we don't have to backfill every existing call site
   * if the operator ever wants to lock the page to authed users only.
   */
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  unitPriceMinor?: number;
  currency?: string;
}

/**
 * Per-tile "Add to cart" trigger. Stays compact so it fits inside the
 * pastry card overlay without crowding the price.
 *
 * Auth split:
 *   - Authed visitors: POST `/pastry-cart/items` server-side and refresh.
 *   - Anonymous visitors: write the line into the localStorage guest
 *     cart and emit the same cart-updated event the authed path uses.
 *     No redirect — the visitor keeps browsing. They'll be asked to
 *     sign in only at checkout, where we sync the guest cart up to
 *     the server cart.
 */
export function AddToCartButton({
  pastryItemId,
  itemName,
  isAuthed,
  slug,
  description = null,
  imageUrl = null,
  unitPriceMinor,
  currency,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onClick = async () => {
    setFeedback(null);

    // ----- Anonymous path: localStorage guest cart -----
    if (!isAuthed) {
      // Without the snapshot fields we can't render the line on the
      // cart page later, so refuse the add and fall back to the
      // sign-in redirect. In practice every caller on the cravings
      // page passes these — this is just defensive.
      if (
        !slug ||
        typeof unitPriceMinor !== "number" ||
        !currency
      ) {
        router.push("/login?next=/cart");
        return;
      }
      try {
        addToGuestCart(
          {
            pastryItemId,
            slug,
            name: itemName,
            description,
            imageUrl,
            unitPriceMinor,
            currency,
          },
          1,
        );
        emitCartUpdated();
        setFeedback("Added to cart");
        window.setTimeout(() => setFeedback(null), 2200);
      } catch {
        setFeedback("Couldn't add to cart on this device.");
      }
      return;
    }

    // ----- Authed path: server cart -----
    setPending(true);
    try {
      await apiFetch("/pastry-cart/items", {
        method: "POST",
        body: { pastryItemId, quantity: 1 },
      });
      emitCartUpdated();
      setFeedback("Added to cart");
      router.refresh();
      window.setTimeout(() => setFeedback(null), 2200);
    } catch (err) {
      // Keep the error message visible until the user clicks again — no
      // auto-dismiss for failures so they don't wonder what happened.
      setFeedback(err instanceof ApiError ? err.detail : "Couldn't add to cart.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="absolute inset-x-0 top-0 flex justify-end p-3">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={pending}
        aria-label={`Add ${itemName} to cart`}
        className="rounded-pill bg-cream-50/95 px-4 py-1.5 font-display text-sm italic text-maroon-700 shadow-sm backdrop-blur transition-colors duration-fast ease-brand hover:bg-orange-100 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : feedback ? feedback : "Add to cart"}
      </button>
    </div>
  );
}
