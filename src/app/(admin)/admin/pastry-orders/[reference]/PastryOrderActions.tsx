"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { ApiError, apiFetch } from "@/lib/api";

import { type PastryOrderDetail } from "./page";

interface PastryOrderActionsProps {
  reference: string;
  status: PastryOrderDetail["status"];
  internalNotes: string | null;
}

/**
 * Allowed forward transitions, mirrored from the API service. Keeping
 * these in lock-step is what makes the buttons render only when valid.
 * Any drift will surface immediately as a 400 from the API, so it's
 * safe to render an action that the server might also reject.
 */
const FORWARD: Record<PastryOrderDetail["status"], Array<{ to: PastryOrderDetail["status"]; label: string }>> = {
  PENDING_PAYMENT: [],
  PAID: [{ to: "PREPARING", label: "Start preparing" }],
  PREPARING: [{ to: "READY", label: "Mark as ready" }],
  READY: [
    { to: "SHIPPED", label: "Out for delivery" },
    { to: "DELIVERED", label: "Mark delivered" },
  ],
  SHIPPED: [{ to: "DELIVERED", label: "Mark delivered" }],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const TERMINAL = new Set<PastryOrderDetail["status"]>(["DELIVERED", "CANCELLED", "REFUNDED"]);

/**
 * Right-rail action panel — forward-status buttons, internal notes
 * editor, and a destructive-cancel control. All mutations re-fetch the
 * page via `router.refresh()` so the timeline + status badge stay in
 * sync without a hard reload.
 */
export function PastryOrderActions({ reference, status, internalNotes }: PastryOrderActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState(internalNotes ?? "");

  const transition = async (to: PastryOrderDetail["status"], note?: string) => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await apiFetch(`/admin/pastry-orders/${reference}/status`, {
        method: "PATCH",
        body: { status: to, ...(note ? { note } : {}) },
      });
      setSuccess(`Status moved to ${to.replace(/_/g, " ").toLowerCase()}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't update status.");
    } finally {
      setPending(false);
    }
  };

  const cancel = async () => {
    const confirmed = window.confirm(
      "Cancel this order? The customer will be emailed and credits returned to their balance.",
    );
    if (!confirmed) return;
    await transition("CANCELLED");
  };

  const saveNotes = async () => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await apiFetch(`/admin/pastry-orders/${reference}/notes`, {
        method: "PATCH",
        body: { internalNotes: notesDraft.trim() || undefined },
      });
      setSuccess("Internal notes saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save notes.");
    } finally {
      setPending(false);
    }
  };

  const forward = FORWARD[status];

  return (
    <div className="space-y-6">
      <section className="border border-cream-200 bg-paper p-6">
        <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
          Actions
        </h2>

        {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}
        {success ? <Alert variant="success" className="mb-4">{success}</Alert> : null}

        {forward.length === 0 && !TERMINAL.has(status) ? (
          <p className="m-0 mb-4 font-sans text-sm text-neutral-700">
            Waiting on payment confirmation. Once Stripe completes, the order
            will move to <strong>Paid</strong> automatically.
          </p>
        ) : null}

        {TERMINAL.has(status) ? (
          <p className="m-0 mb-4 font-sans text-sm text-neutral-700">
            This order is finalised. No further status changes are possible.
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {forward.map((option) => (
            <Button
              key={option.to}
              type="button"
              variant="primary"
              size="sm"
              block
              disabled={pending}
              onClick={() => void transition(option.to)}
            >
              {option.label}
            </Button>
          ))}
          {!TERMINAL.has(status) && status !== "PENDING_PAYMENT" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              block
              disabled={pending}
              onClick={() => void cancel()}
              className="!text-semantic-danger"
            >
              Cancel order
            </Button>
          ) : null}
        </div>
      </section>

      <section className="border border-cream-200 bg-paper p-6">
        <h2 className="m-0 mb-2 font-display text-2xl font-medium text-maroon-600">
          Internal notes
        </h2>
        <p className="mb-3 font-sans text-xs text-neutral-500">
          Visible to admins only — never shown to the customer or in any email.
        </p>
        <textarea
          rows={5}
          maxLength={2000}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          className="w-full border border-cream-200 bg-cream-50 px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => void saveNotes()}
          className="mt-3"
        >
          Save notes
        </Button>
      </section>
    </div>
  );
}
