"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";

interface CartActionsProps {
  cartItemId: string;
  quantity: number;
  unitPriceMinor: number;
  currency: string;
}

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * Compact stepper + remove control on each cart line. Brand-styled
 * (square edges, maroon outline, italic-serif "remove"). Optimistic
 * navigation refresh after each mutation so the summary updates.
 */
export function CartActions({
  cartItemId,
  quantity,
  unitPriceMinor,
  currency,
}: CartActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (next: number) => {
    if (next < 1) return; // floor at 1 — to remove, use the remove button
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/pastry-cart/items/${cartItemId}`, {
        method: "PATCH",
        body: { quantity: next },
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't update.");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/pastry-cart/items/${cartItemId}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't remove.");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="inline-flex items-center border border-cream-200 bg-cream-50">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => void update(quantity - 1)}
          disabled={pending || quantity <= 1}
          className="px-3 py-2 font-display text-base text-maroon-700 hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[2.5rem] text-center font-sans text-sm font-semibold text-neutral-800">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => void update(quantity + 1)}
          disabled={pending}
          className="px-3 py-2 font-display text-base text-maroon-700 hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
      <span className="font-sans text-xs text-neutral-500">
        {fmt(unitPriceMinor, currency)} each
      </span>
      <button
        type="button"
        onClick={() => void remove()}
        disabled={pending}
        className="font-display text-sm italic text-orange-700 underline underline-offset-4 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Remove
      </button>
      {error ? (
        <span role="alert" className="font-sans text-xs text-semantic-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
