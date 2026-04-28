"use client";

import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * ManageSubscription — opens a Stripe Customer Portal session.
 *
 * Stripe-hosted so the customer can pause, change plan, update payment
 * method, or cancel without us writing any of those forms ourselves.
 * On return we re-render the page; the next webhook will sync the new state.
 */
export function ManageSubscription() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setError(null);
    setPending(true);
    try {
      const result = await apiFetch<{ url: string }>("/cravings/portal", {
        method: "POST",
      });
      window.location.assign(result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't open the customer portal.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {error ? (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      ) : null}
      <Button onClick={() => void open()} disabled={pending}>
        {pending ? "Opening…" : "Manage subscription"}
      </Button>
      <p className="mt-2 font-sans text-xs text-neutral-500">
        Pause, change plan, update payment, or cancel via Stripe.
      </p>
    </>
  );
}
