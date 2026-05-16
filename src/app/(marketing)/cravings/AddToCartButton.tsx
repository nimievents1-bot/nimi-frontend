"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { emitCartUpdated } from "@/components/patterns/CartIndicator";
import { ApiError, apiFetch } from "@/lib/api";

interface AddToCartButtonProps {
  pastryItemId: string;
  itemName: string;
  /** When false, render a sign-in prompt instead of an add-to-cart action. */
  isAuthed: boolean;
}

/**
 * Per-tile "Add to cart" trigger. Stays compact so it fits inside the
 * pastry card overlay without crowding the price.
 *
 * Auth-gated: unauthenticated users get redirected to /login with the
 * cart as the post-login destination, so the click flow always lands
 * back at the action they wanted.
 */
export function AddToCartButton({
  pastryItemId,
  itemName,
  isAuthed,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onClick = async () => {
    if (!isAuthed) {
      router.push("/login?next=/cart");
      return;
    }
    setFeedback(null);
    setPending(true);
    try {
      await apiFetch("/pastry-cart/items", {
        method: "POST",
        body: { pastryItemId, quantity: 1 },
      });
      // Two-pronged feedback so the user can't miss that the click took:
      //   1. The inline pill flips to "Added <name>" for ~2 seconds.
      //   2. The cart icon in the header re-fetches and the badge ticks
      //      up — fires via a custom window event so we don't have to
      //      thread a setter all the way up through the React tree.
      emitCartUpdated();
      setFeedback("Added to cart");
      router.refresh();
      // Clear the inline feedback after a short delay so it doesn't linger.
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
        aria-label={isAuthed ? `Add ${itemName} to cart` : `Sign in to order ${itemName}`}
        className="rounded-pill bg-cream-50/95 px-4 py-1.5 font-display text-sm italic text-maroon-700 shadow-sm backdrop-blur transition-colors duration-fast ease-brand hover:bg-orange-100 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : feedback ? feedback : isAuthed ? "Add to cart" : "Sign in"}
      </button>
    </div>
  );
}
