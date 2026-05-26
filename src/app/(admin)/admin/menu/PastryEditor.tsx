"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConfirm } from "@/components/patterns/ConfirmDialog";
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
  /**
   * Minimum order quantity. Defaults to 1 on the API (= no minimum)
   * so historical rows naturally get the unrestricted behaviour.
   */
  minQuantity: number;
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
  const confirm = useConfirm();

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
  // Minimum order quantity. Show empty string when the value is 1
  // (the API default = "no minimum") so the field reads as "no
  // constraint" rather than displaying a misleading "1" that looks
  // like an explicit setting.
  const [minQuantity, setMinQuantity] = useState<string>(
    row?.minQuantity && row.minQuantity > 1 ? String(row.minQuantity) : "",
  );
  const [leadTimeDays, setLeadTimeDays] = useState<string>(
    row ? String(row.leadTimeDays) : "0",
  );
  const [displayOrder, setDisplayOrder] = useState<string>(
    row ? String(row.displayOrder) : "0",
  );
  // Default to available: true on create so the founder doesn't have to
  // tick a second box to make their item visible. On edit, preserve the
  // existing visibility state.
  const [available, setAvailable] = useState<boolean>(
    mode === "create" ? true : row?.available ?? false,
  );

  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Upload a file from the local device to our Cloudflare R2 bucket via
   * the `/api/upload/image` route. The server resizes (max 1600 px on
   * the long edge), strips metadata, and re-encodes as WebP before
   * storing — so a 5 MB camera-roll JPEG typically lands as a 200 KB
   * WebP, fast to load on phones. Failure surfaces inline; the URL
   * field stays editable so admin can paste a fallback URL if needed.
   */
  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Pre-fill alt text with the original filename if alt is empty,
      // so screen-readers and the cravings page have something useful
      // before the admin types a real description.
      if (!imageAlt.trim()) {
        const niceName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setImageAlt(niceName);
      }
      // Surface the optimisation result so the admin sees that the
      // upload was shrunk — this is the kind of feedback that builds
      // trust in the pipeline ("did it actually do anything?").
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
      // Reset the file input so re-selecting the same file fires `onChange` again.
      e.target.value = "";
    }
  };

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
      // Send `1` explicitly when the field is empty so the API can
      // distinguish "operator wants no minimum" from "operator didn't
      // touch this field". The DTO accepts 1 as "no minimum" because
      // it's the schema default.
      minQuantity: minQuantity ? Number(minQuantity) : 1,
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
    const confirmed = await confirm({
      title: `Delete "${row.name}"?`,
      description: "This removes it from the menu permanently. Customers will no longer see it on /cravings, and the slug becomes unavailable.",
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
      variant: "danger",
    });
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

      {/*
        Image: file picker (uploads to Vercel Blob) + URL field + alt text.
        Preview is shown when a URL is set so the admin sees what the
        customer will see. Clearing the URL field reverts to the brand
        gradient on the public page.
      */}
      <fieldset className="space-y-3">
        <legend className="mb-2 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Image
        </legend>

        <div className="flex flex-wrap items-start gap-4">
          {imageUrl ? (
            <div
              role="img"
              aria-label={imageAlt || "Image preview"}
              className="aspect-square w-32 flex-none border border-cream-200 bg-cream-100"
              style={{
                backgroundImage: `url("${imageUrl}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : (
            <div
              aria-hidden
              className="flex aspect-square w-32 flex-none items-center justify-center border border-dashed border-cream-200 bg-cream-100 font-sans text-xs text-neutral-500"
            >
              No image
            </div>
          )}

          <div className="flex-1 space-y-2">
            <label className="inline-flex cursor-pointer items-center gap-3 border border-cream-200 bg-cream-50 px-4 py-2 font-display text-base italic text-maroon-700 hover:border-orange-200 hover:bg-orange-50">
              <span>{uploading ? "Uploading…" : "Upload from device"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(e) => void onFileSelected(e)}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="m-0 font-sans text-xs text-neutral-500">
              PNG, JPG, WebP or AVIF up to 5 MB. Stored privately, served publicly.
            </p>

            <label className="block pt-2 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
              Or paste an image URL
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={`${fieldClass} mt-1`}
              />
            </label>

            {imageUrl ? (
              <button
                type="button"
                onClick={() => {
                  setImageUrl("");
                  setImageAlt("");
                }}
                className="font-display text-sm italic text-orange-700 underline underline-offset-4 hover:text-orange-800"
              >
                Remove image
              </button>
            ) : null}
          </div>
        </div>

        <label className="flex flex-col gap-1 pt-2">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Image alt text
          </span>
          <input
            type="text"
            maxLength={160}
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Short description of the image — used by screen readers"
            className={fieldClass}
          />
        </label>
      </fieldset>

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
        {/*
          Per-item minimum order quantity. Customers can't proceed to
          checkout if any cart line falls below the value set here.
          Blank or 1 means "no minimum" — the API normalises both to
          the schema default. Surface this next to the batch limit so
          both kitchen-side constraints sit together.
        */}
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Minimum order quantity (blank or 1 = no minimum)
          </span>
          <input
            type="number"
            min={1}
            max={999}
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            placeholder="e.g. 6 for fish roe"
            className={fieldClass}
          />
          <span className="font-sans text-xs italic text-neutral-500">
            Customers can&rsquo;t check out with a smaller quantity of this item.
            Lines below the minimum show a warning in the cart.
          </span>
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
