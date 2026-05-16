"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";

interface Props {
  slug: string;
  name: string;
  description: string | null;
  monthlyAmountMinor: number;
  currency: string;
  position: number;
}

/**
 * Re-runs the admin upsert for a single plan so the API creates (or
 * reuses) a Stripe Product and Price for it. Once Stripe returns a
 * Price ID, the plan flips to `stripeReady: true` and the marketing
 * "Coming soon" tag becomes a live "Join the club" CTA.
 *
 * Safe to click multiple times — the upsert path reuses an existing
 * Stripe Product and only mints a new Price if the amount changed.
 */
export function PlanPublishButton(props: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setError(null);
    setPending(true);
    try {
      await apiFetch("/admin/cravings/plans", {
        method: "POST",
        body: {
          slug: props.slug,
          name: props.name,
          description: props.description ?? undefined,
          monthlyAmountMinor: props.monthlyAmountMinor,
          currency: props.currency,
          position: props.position,
          active: true,
        },
      });
      // Re-fetch the server component so the badge flips immediately.
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.title || "Publish failed.");
      } else {
        setError(err instanceof Error ? err.message : "Publish failed.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="bg-orange-600 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream-50 hover:bg-orange-700 disabled:opacity-60"
      >
        {pending ? "Publishing…" : "Publish to Stripe"}
      </button>
      {error ? (
        <span className="max-w-[14rem] text-right font-sans text-xs text-semantic-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
