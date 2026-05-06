"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { ApiError, apiFetch } from "@/lib/api";

export interface PastryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  imageUrl: string | null;
  imageAlt: string | null;
  tags: string[] | unknown;
  batchLimit: number | null;
  leadTimeDays: number;
  displayOrder: number;
  available: boolean;
}

type Mode = "create" | "edit";

interface PastryEditorProps {
  mode: Mode;
  row?: PastryRow;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * PastryEditor — create-and-edit form for /admin/menu.
 *
 * - "create" → POSTs to /admin/pastries; on success router.push to the
 *   menu list. Slug must be unique server-side; conflict surfaces as a
 *   413 → 409 mapped error in the Alert.
 * - "edit"   → PATCHes /admin/pastries/:id and refreshes; offers Delete
 *   below for OWNER (server enforces; we still render the button for
 *   simplicity and let the API 403).
 *
 * Prices are entered in pounds for ergonomics (`£5.00`), then converted
 * to minor units (pence) before submission. We never round — `Math.round`
 * is intentional so 5.005 doesn't drift to 5.00, and the input itself
 * uses `step="0.01"` to discourage three-decimal input.
 */
export function PastryEditor({ mode, row }: PastryEditorProps) {
  const router = useRouter();

  const [slug, setSlug] = useState(row?.slug ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [priceGBP, setPriceGBP] = useState(
    row ? (row.priceMinor / 100).toFixed(2) : "5.00",
  );
  const [imageUrl, setImageUrl] = useState(row?.imageUrl ?? "");
  const [imageAlt, setImageAlt] = useState(row?.imageAlt ?? "");
  const [tagsCSV, setTagsCSV] = useState(
    Array.isArray(row?.tags) ? row.tags.join(", ") : "",
  );
  const [batchLimit, setBatchLimit] = useState<string>(
    row?.batchLimit !== null && row?.batchLimit !== undefined ? String(row.batchLimit) : "",
  );
  const [leadTimeDays, setLeadTimeDays] = useState<string>(
    row ? String(row.leadTimeDays) : "0",
  );
  const [displayOrder, setDisplayOrder] = useState<string>(
    row ? String(row.displayOrder) : "0",
  );
  const [available, setAvailable] = useState<boolean>(row?.available ?? false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!SLUG_REGEX.test(slug.trim())) {
      setError("Slug must use lowercase letters, numbers and hyphens (e.g. `meat-pie`).");
      return;
    }
    const priceFloat = Number(priceGBP);
    if (!Number.isFinite(priceFloat) || priceFloat <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    setPending(true);

    const tags = tagsCSV
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      slug: slug.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      priceMinor: Math.round(priceFloat * 100),
      imageUrl: imageUrl.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      tags,
      batchLimit: batchLimit ? Number(batchLimit) : undefined,
      leadTimeDays: Number(leadTimeDays) || 0,
      displayOrder: Number(displayOrder) || 0,
      available,
    };

    try {
      if (mode === "create") {
        const created = await apiFetch<{ id: string }>("/admin/pastries", {
          method: "POST",
          body: payload,
        });
        router.push(`/admin/menu/${created.id}`);
        router.refresh();
      } else if (row) {
        await apiFetch(`/admin/pastries/${row.id}`, {
          method: "PATCH",
          body: payload,
        });
        setSuccess("Saved.");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save the item.");
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!row) return;
    const confirmed = window.confirm(
      `Delete "${row.name}"? This removes it from the menu permanently.`,
    );
    if (!confirmed) return;
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/admin/pastries/${row.id}`, { method: "DELETE" });
      router.push("/admin/menu");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't delete the item.");
      setPending(false);
    }
  };

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Name
          </span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Slug
          </span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={60}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="e.g. meat-pie"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Description (optional)
        </span>
        <textarea
          maxLength={800}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Price (GBP)
          </span>
          <input
            type="number"
            required
            step="0.01"
            min="0.01"
            value={priceGBP}
            onChange={(e) => setPriceGBP(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Lead time (days)
          </span>
          <input
            type="number"
            min={0}
            max={60}
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Display order
          </span>
          <input
            type="number"
            min={0}
            max={10000}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Image URL (R2 / Unsplash / etc.)
          </span>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Image alt text
          </span>
          <input
            type="text"
            maxLength={160}
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Tags (comma-separated)
          </span>
          <input
            type="text"
            value={tagsCSV}
            onChange={(e) => setTagsCSV(e.target.value)}
            placeholder="e.g. savoury, spicy, limited"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Batch limit per fulfilment day (blank = no cap)
          </span>
          <input
            type="number"
            min={1}
            max={10000}
            value={batchLimit}
            onChange={(e) => setBatchLimit(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Available on /cravings (customers can see and order)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create item" : "Save changes"}
        </Button>
        {mode === "edit" && row ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDelete}
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
