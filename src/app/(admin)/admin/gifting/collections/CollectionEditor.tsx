"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { useConfirm } from "@/components/patterns/ConfirmDialog";
import { ApiError, apiFetch } from "@/lib/api";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Category = "CORPORATE" | "WEDDINGS" | "PRIVATE";

export interface CollectionRow {
  id: string;
  slug: string;
  category: Category;
  name: string;
  description: string;
  items: unknown;
  unitPriceMinor: number;
  priceMaxMinor: number | null;
  currency: string;
  moq: number;
  leadTimeDays: number;
  imageUrl: string | null;
  published: boolean;
  position: number;
}

interface Props {
  mode: "create" | "edit";
  row?: CollectionRow;
}

/**
 * CollectionEditor — single form covering create + edit for
 * `GiftCollection`. Mirrors `PastryEditor` in structure so the two
 * admin catalogue editors feel like siblings.
 *
 * Items list:
 *   The schema stores `items` as a JSON array of strings. The
 *   simplest editing UX is a textarea where each line is one entry;
 *   we parse on submit. Operators don't need to learn JSON to add a
 *   bullet to "What's inside".
 *
 * Price entry:
 *   Both `unitPriceMinor` and `priceMaxMinor` are entered in pounds
 *   for ergonomics. Converted to minor units on submit. The "max"
 *   field is blank-to-clear: blanking it sends `null` to the API
 *   (tri-state), so the operator can switch between "exact price"
 *   and "indicative range" without round-tripping through a
 *   restart.
 *
 * Delete:
 *   OWNER-only on the API side. The button shows up for everyone in
 *   the UI; the API returns 403 if EDITOR tries to use it. We could
 *   read the session role here and hide the button proactively, but
 *   surfacing the error message is honest about what's happening
 *   ("delete needs OWNER" rather than "this button is gone, who
 *   knows why").
 */
export function CollectionEditor({ mode, row }: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  // Snapshot the initial items array → multi-line string for the
  // textarea. Defensive against `unknown` (Prisma's Json type) by
  // narrowing in the conversion.
  const initialItemsText = Array.isArray(row?.items)
    ? (row.items as unknown[])
        .map((s) => (typeof s === "string" ? s : String(s)))
        .join("\n")
    : "";

  const [slug, setSlug] = useState(row?.slug ?? "");
  const [category, setCategory] = useState<Category>(row?.category ?? "CORPORATE");
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [itemsText, setItemsText] = useState(initialItemsText);
  const [priceGBP, setPriceGBP] = useState(
    row ? (row.unitPriceMinor / 100).toFixed(2) : "10.00",
  );
  // priceMaxGBP empty string means "no indicative max" — sent as
  // null on submit so the API clears the column if it was set.
  const [priceMaxGBP, setPriceMaxGBP] = useState(
    row?.priceMaxMinor ? (row.priceMaxMinor / 100).toFixed(2) : "",
  );
  const [moq, setMoq] = useState<string>(
    row ? String(row.moq) : "25",
  );
  const [leadTimeDays, setLeadTimeDays] = useState<string>(
    row ? String(row.leadTimeDays) : "56",
  );
  const [imageUrl, setImageUrl] = useState(row?.imageUrl ?? "");
  const [position, setPosition] = useState<string>(
    row ? String(row.position) : "0",
  );
  // Default to published on create — the operator's intent when
  // they reach "New collection" is usually to publish, and they
  // can flip the box off if they want a draft. Matches the
  // pastry editor's choice.
  const [published, setPublished] = useState<boolean>(
    mode === "create" ? true : row?.published ?? false,
  );

  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

  /**
   * Upload helper — same R2 pipeline the pastry editor uses. The
   * server resizes to max 1600 px on the long edge, strips EXIF, and
   * re-encodes as WebP. A 5 MB phone photo typically lands as ~200
   * KB. We pre-fill `imageUrl` on success.
   */
  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
        originalBytes?: number;
        optimisedBytes?: number;
      };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed.");
      }
      setImageUrl(data.url);
      if (
        typeof data.originalBytes === "number" &&
        typeof data.optimisedBytes === "number" &&
        data.originalBytes > 0
      ) {
        const kb = (n: number) =>
          n >= 1024 * 1024
            ? `${(n / 1024 / 1024).toFixed(1)} MB`
            : `${Math.max(1, Math.round(n / 1024))} KB`;
        const pct = Math.round(
          (1 - data.optimisedBytes / data.originalBytes) * 100,
        );
        setSuccess(
          `Image optimised: ${kb(data.originalBytes)} → ${kb(data.optimisedBytes)}` +
            (pct > 0 ? ` (${pct}% smaller)` : ""),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side guards — server re-validates. We catch the most
    // common typos here so the round-trip stays free.
    if (!SLUG_REGEX.test(slug.trim())) {
      setError("Slug must be lowercase letters, numbers and hyphens.");
      return;
    }
    const priceFloat = parseFloat(priceGBP);
    if (!Number.isFinite(priceFloat) || priceFloat <= 0) {
      setError("Base price must be a positive number.");
      return;
    }
    const priceMaxFloat = priceMaxGBP.trim() ? parseFloat(priceMaxGBP) : null;
    if (priceMaxFloat !== null && (!Number.isFinite(priceMaxFloat) || priceMaxFloat <= 0)) {
      setError("Max price must be a positive number, or blank.");
      return;
    }
    if (priceMaxFloat !== null && priceMaxFloat < priceFloat) {
      setError("Max price can't be less than the base price.");
      return;
    }

    const items = itemsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setPending(true);

    const payload = {
      slug: slug.trim(),
      category,
      name: name.trim(),
      description: description.trim(),
      items,
      unitPriceMinor: Math.round(priceFloat * 100),
      // Blank max price → null (operator cleared it). Tri-state.
      priceMaxMinor: priceMaxFloat === null ? null : Math.round(priceMaxFloat * 100),
      moq: Number(moq) || 1,
      leadTimeDays: Number(leadTimeDays) || 0,
      // Empty string → null so the API clears the column.
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      published,
      position: Number(position) || 0,
    };

    try {
      if (mode === "create") {
        const created = await apiFetch<{ id: string }>(
          "/admin/gifting/collections",
          { method: "POST", body: payload },
        );
        router.push(`/admin/gifting/collections/${created.id}`);
        router.refresh();
      } else if (row) {
        await apiFetch(`/admin/gifting/collections/${row.id}`, {
          method: "PATCH",
          body: payload,
        });
        setSuccess("Saved.");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save the collection.");
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!row) return;
    const confirmed = await confirm({
      title: `Delete "${row.name}"?`,
      description:
        "This removes it from the catalogue permanently. If the collection has historical orders, the API will refuse — unpublish it instead.",
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
      variant: "danger",
    });
    if (!confirmed) return;
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/admin/gifting/collections/${row.id}`, { method: "DELETE" });
      router.push("/admin/gifting/collections");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't delete the collection.");
      setPending(false);
    }
  };

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
            maxLength={120}
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
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. signature-collection"
            className={fieldClass}
          />
          <span className="font-sans text-xs italic text-neutral-500">
            URL handle. Lowercase letters, numbers and hyphens only.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={fieldClass}
          >
            <option value="CORPORATE">Corporate</option>
            <option value="WEDDINGS">Weddings</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Position (lower = earlier)
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
          Description
        </span>
        <textarea
          required
          minLength={2}
          maxLength={1000}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          What&rsquo;s inside (one item per line)
        </span>
        <textarea
          rows={6}
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
          placeholder={"Truffles\nLoose-leaf tea\nSignature card"}
          className={fieldClass}
        />
        <span className="font-sans text-xs italic text-neutral-500">
          Each line becomes a bullet on the gift collection page.
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Base price (£)
          </span>
          <input
            type="number"
            required
            min={0.01}
            step={0.01}
            value={priceGBP}
            onChange={(e) => setPriceGBP(e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Indicative max price (£, blank = exact)
          </span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={priceMaxGBP}
            onChange={(e) => setPriceMaxGBP(e.target.value)}
            placeholder="e.g. 15.00"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Minimum order quantity
          </span>
          <input
            type="number"
            min={1}
            max={10000}
            value={moq}
            onChange={(e) => setMoq(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 md:max-w-xs">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Lead time (days)
        </span>
        <input
          type="number"
          min={0}
          max={365}
          value={leadTimeDays}
          onChange={(e) => setLeadTimeDays(e.target.value)}
          className={fieldClass}
        />
      </label>

      <fieldset className="border border-cream-200 bg-cream-50 p-4">
        <legend className="px-2 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Hero image
        </legend>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
              Image URL
            </span>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className={fieldClass}
            />
            <span className="font-sans text-xs italic text-neutral-500">
              Blank = the public site falls back to per-slug placeholder photography.
            </span>
          </label>

          <label className="inline-flex items-center justify-center border border-cream-200 bg-paper px-4 py-2 font-display text-base italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100">
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelected}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? "Uploading…" : "Upload from device"}
          </label>
        </div>
      </fieldset>

      <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Published (visible on /gifting)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create collection" : "Save changes"}
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
