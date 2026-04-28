"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import {
  SelectField,
  TextareaField,
} from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface Props {
  orderId: string;
  currentStatus: string;
  currentInternalNotes: string;
}

const STATUSES = [
  "PENDING_PAYMENT",
  "AWAITING_DESIGN_APPROVAL",
  "DESIGN_SENT",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function AdminOrderActions({ orderId, currentStatus, currentInternalNotes }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentInternalNotes);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = async () => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await apiFetch(`/admin/gifting/orders/${orderId}`, {
        method: "PATCH",
        body: {
          ...(status !== currentStatus ? { status } : {}),
          ...(notes !== currentInternalNotes ? { internalNotes: notes } : {}),
        },
      });
      setSuccess("Order updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update order.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border border-cream-200 bg-paper p-6">
      <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">Actions</h2>

      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      ) : null}

      <SelectField
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        hint="Illegal transitions are rejected by the API (e.g. you can't move from SHIPPED back to IN_PRODUCTION)."
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </SelectField>

      <TextareaField
        label="Internal notes"
        rows={5}
        hint="Visible to admins only."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <Button
        onClick={() => void save()}
        disabled={pending || (status === currentStatus && notes === currentInternalNotes)}
      >
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
