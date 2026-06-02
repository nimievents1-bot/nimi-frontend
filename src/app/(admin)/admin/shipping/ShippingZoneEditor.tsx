"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { useConfirm } from "@/components/patterns/ConfirmDialog";
import { ApiError, apiFetch } from "@/lib/api";

export interface ShippingZoneRow {
  id: string;
  name: string;
  description: string | null;
  postcodePrefixes: unknown;
  feeMinor: number;
  freeOverEnabled: boolean;
  freeOverMinor: number | null;
  active: boolean;
  position: number;
}

interface Props {
  mode: "create" | "edit";
  row?: ShippingZoneRow;
}

/**
 * Shared create+edit form for `ShippingZone`. Postcode prefixes
 * come in as a comma-separated string from a single text input —
 * we parse, dedupe and uppercase before submit. Prices are in
 * pounds and converted to minor units on the wire.
 */
export function ShippingZoneEditor({ mode, row }: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  // Parse initial prefixes for the textarea.
  const initialPrefixes = Array.isArray(row?.postcodePrefixes)
    ? (row.postcodePrefixes as string[]).join(", ")
    : "";

  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [prefixesText, setPrefixesText] = useState(initialPrefixes);
  const [feeGBP, setFeeGBP] = useState(
    row ? (row.feeMinor / 100).toFixed(2) : "6.95",
  );
  const [freeOverEnabled, setFreeOverEnabled] = useState(
    row?.freeOverEnabled ?? false,
  );
  const [freeOverGBP, setFreeOverGBP] = useState(
    row?.freeOverMinor ? (row.freeOverMinor / 100).toFixed(2) : "75.00",
  );
  const [active, setActive] = useState<boolean>(
    mode === "create" ? true : row?.active ?? true,
  );
  const [position, setPosition] = useState<string>(
    row ? String(row.position) : "10",
  );

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const feeFloat = parseFloat(feeGBP);
    if (!Number.isFinite(feeFloat) || feeFloat < 0) {
      setError("Base fee must be a non-negative number.");
      return;
    }

    let freeOverMinor: number | null = null;
    if (freeOverEnabled) {
      const freeOverFloat = parseFloat(freeOverGBP);
      if (!Number.isFinite(freeOverFloat) || freeOverFloat <= 0) {
        setError("Free-over threshold must be a positive number when enabled.");
        return;
      }
      freeOverMinor = Math.round(freeOverFloat * 100);
    }

    // Parse comma- or whitespace-separated prefixes. Empty input
    // produces empty array → catch-all/default zone.
    const postcodePrefixes = prefixesText
      .split(/[,\s]+/)
      .map((s) => s.toUpperCase().trim())
      .filter(Boolean);

    setPending(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      postcodePrefixes,
      feeMinor: Math.round(feeFloat * 100),
      freeOverEnabled,
      freeOverMinor,
      active,
      position: Number(position) || 0,
    };

    try {
      if (mode === "create") {
        const created = await apiFetch<{ id: string }>(
          "/admin/shipping/zones",
          { method: "POST", body: payload },
        );
        router.push(`/admin/shipping/${created.id}`);
        router.refresh();
      } else if (row) {
        await apiFetch(`/admin/shipping/zones/${row.id}`, {
          method: "PATCH",
          body: payload,
        });
        setSuccess("Saved.");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save the zone.");
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!row) return;
    const confirmed = await confirm({
      title: `Delete "${row.name}"?`,
      description:
        "Customers in this zone's postcodes will see no fee until you add a replacement or rely on the catch-all default. To take a zone offline temporarily, toggle Active off instead.",
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
      variant: "danger",
    });
    if (!confirmed) return;
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/admin/shipping/zones/${row.id}`, { method: "DELETE" });
      router.push("/admin/shipping");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't delete.");
      setPending(false);
    }
  };

  return (
    // Adapt async handler to React's sync event-handler type.
    <form
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      className="space-y-4"
    >
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Zone name
          </span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. UK mainland"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Position (lower = checked first)
          </span>
          <input
            type="number"
            min={0}
            max={10000}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Postcode prefixes (comma-separated, blank = catch-all)
        </span>
        <textarea
          rows={2}
          value={prefixesText}
          onChange={(e) => setPrefixesText(e.target.value)}
          placeholder="e.g. BD, LS, HX, HD, WF"
          className={fieldClass}
        />
        <span className="font-sans text-xs italic text-neutral-500">
          The first letters of UK postcodes. Customer&rsquo;s postcode &ldquo;LS12 5AB&rdquo; matches
          any prefix that the postcode starts with. Leave blank to make this
          the catch-all default for postcodes no other zone covers.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Internal description (admin only)
        </span>
        <input
          type="text"
          maxLength={400}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional note — e.g. 'Our own van' or 'Royal Mail tracked 48'"
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Base delivery fee (£)
          </span>
          <input
            type="number"
            required
            min={0}
            step={0.01}
            value={feeGBP}
            onChange={(e) => setFeeGBP(e.target.value)}
            className={fieldClass}
          />
          <span className="font-sans text-xs italic text-neutral-500">
            Set to 0.00 to make delivery free in this zone permanently.
          </span>
        </label>

        <div className="flex flex-col gap-2 border border-cream-200 bg-cream-50 p-3">
          <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={freeOverEnabled}
              onChange={(e) => setFreeOverEnabled(e.target.checked)}
              className="h-4 w-4 accent-orange-600"
            />
            Offer free delivery over a basket threshold
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
              Free over (£)
            </span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={freeOverGBP}
              onChange={(e) => setFreeOverGBP(e.target.value)}
              disabled={!freeOverEnabled}
              className={`${fieldClass} ${freeOverEnabled ? "" : "opacity-50"}`}
            />
            <span className="font-sans text-xs italic text-neutral-500">
              When the cart subtotal hits this amount, the delivery fee drops to 0
              for customers in this zone.
            </span>
          </label>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Active (zone is in effect at checkout)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create zone" : "Save changes"}
        </Button>
        {mode === "edit" && row ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void onDelete();
            }}
            disabled={pending}
            className="!text-semantic-danger"
          >
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
