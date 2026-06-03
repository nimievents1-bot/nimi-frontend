"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConfirm } from "@/components/patterns/ConfirmDialog";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextareaField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * PlanEditor — shared form for creating and editing Indulgence Club tiers.
 *
 * Mode is `create` when no `existing` prop is supplied — slug input is
 * editable and the title says "New tier". When `existing` is supplied
 * the slug becomes read-only (it's used in Stripe metadata; changing it
 * would orphan webhooks) and the form pre-fills, plus a "Hide tier"
 * affordance appears that flips `active=false` so the plan disappears
 * from /cravings without disturbing existing subscribers.
 *
 * Why slugs aren't deletable from the UI:
 *   - Subscriptions in our DB and on Stripe both reference the plan.
 *   - Hard-deleting a plan with live subscribers would either:
 *       (a) violate the FK (Prisma would 500), or
 *       (b) cascade-delete the subscription, which is a real money
 *           consequence that should never happen by mistake.
 *   - "Hide" achieves the operator goal (retire a tier from sale)
 *     without any data loss. Subscribers stay on their existing Stripe
 *     subscription until they cancel or you migrate them.
 *
 * All saves go through `POST /admin/cravings/plans` (the upsert
 * endpoint). The endpoint reuses an existing Stripe Product when the
 * slug matches and mints a new Stripe Price when the amount changes —
 * Stripe archives the old Price. Existing subscribers stay on the old
 * Price; only new subscribers see the new amount.
 */

export interface ExistingPlan {
  slug: string;
  name: string;
  description: string | null;
  monthlyAmountMinor: number;
  currency: string;
  position: number;
  active: boolean;
  stripeReady: boolean;
  /**
   * Optional hero image for the plan card on /cravings. Null when
   * no image has been uploaded — the public site renders the brand
   * gradient placeholder in that case.
   */
  imageUrl: string | null;
}

interface Props {
  /** When provided, the form runs in edit mode. */
  existing?: ExistingPlan;
}

export function PlanEditor({ existing }: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  const mode: "create" | "edit" = existing ? "edit" : "create";

  // Form state. Amount lives in pounds for ergonomics; converted to
  // pence on submit. Description is the optional pitch shown on cards
  // (e.g. "A weekly treat — perfect for individuals.").
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [amountGBP, setAmountGBP] = useState(
    existing ? (existing.monthlyAmountMinor / 100).toFixed(2) : "25.00",
  );
  const [position, setPosition] = useState(String(existing?.position ?? 0));
  const [active, setActive] = useState(existing?.active ?? true);
  // Optional hero image URL for the plan card on /cravings. Same
  // R2-upload pattern as other admin editors. Blank state means
  // "no image" — the public site renders the brand gradient.
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The price-changed flag drives a one-time warning so the operator
  // understands that a price change will mint a new Stripe Price; it
  // doesn't change behaviour.
  const priceChanged =
    existing != null &&
    Math.round(Number(amountGBP) * 100) !== existing.monthlyAmountMinor;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(trimmedSlug)) {
      setError(
        "Slug must be 3–80 characters, lowercase letters / digits / hyphens, and can't start or end with a hyphen.",
      );
      return;
    }
    const parsedAmount = Number(amountGBP);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setError("Monthly amount must be a positive number.");
      return;
    }
    const monthlyAmountMinor = Math.round(parsedAmount * 100);

    // If repricing an existing plan, confirm because it mints a new
    // Stripe Price (which we want, but should be deliberate).
    if (mode === "edit" && priceChanged) {
      const ok = await confirm({
        title: "Change this tier's price?",
        description:
          "Existing subscribers will stay on the old price until they cancel or renew through a new subscription. New subscribers from now on will be charged the updated amount. The change syncs to Stripe automatically.",
        confirmLabel: "Save & re-publish",
        cancelLabel: "Keep current price",
      });
      if (!ok) return;
    }

    setPending(true);
    try {
      await apiFetch("/admin/cravings/plans", {
        method: "POST",
        body: {
          slug: trimmedSlug,
          name: name.trim(),
          description: description.trim() || undefined,
          monthlyAmountMinor,
          currency: existing?.currency ?? "gbp",
          position: Number(position) || 0,
          active,
          // Tri-state: empty string → null (clear); URL → set; the
          // API distinguishes undefined (don't touch) from null
          // (clear) so blanking the field actually wipes the
          // existing image rather than preserving it.
          imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
        },
      });
      router.push("/admin/cravings");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save the tier.");
      setPending(false);
    }
  };

  const onHide = async () => {
    if (!existing) return;
    const ok = await confirm({
      title: `Hide "${existing.name}"?`,
      description:
        "Customers won't see this tier on /cravings anymore. Existing subscribers keep their subscription and credits — nothing is cancelled. You can re-show the tier later by editing it.",
      confirmLabel: "Hide tier",
      cancelLabel: "Keep visible",
      variant: "danger",
    });
    if (!ok) return;

    setError(null);
    setPending(true);
    try {
      await apiFetch("/admin/cravings/plans", {
        method: "POST",
        body: {
          slug: existing.slug,
          name: existing.name,
          description: existing.description ?? undefined,
          monthlyAmountMinor: existing.monthlyAmountMinor,
          currency: existing.currency,
          position: existing.position,
          active: false,
          // Preserve the existing image — hiding a tier shouldn't
          // wipe the photo. Send `undefined` (not in body) when no
          // image was set so the API leaves the column alone.
          ...(existing.imageUrl ? { imageUrl: existing.imageUrl } : {}),
        },
      });
      router.push("/admin/cravings");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't hide the tier.");
      setPending(false);
    }
  };

  /**
   * Image upload via the existing `/api/upload/image` route (R2
   * pipeline). On success we populate the URL field — the operator
   * still has to click Save to commit, so they can change their
   * mind before publishing.
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
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed.");
      }
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {mode === "edit" && existing && !existing.stripeReady ? (
        <Alert variant="warning">
          This tier isn&rsquo;t connected to Stripe yet. Save your changes here, then click
          <strong> Publish to Stripe </strong>on the tiers list — that mints the Stripe Product
          and Price so customers can subscribe.
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Slug *
          </span>
          <input
            className={fieldClass}
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            readOnly={mode === "edit"}
            placeholder="cravings-75"
            required
            minLength={3}
            maxLength={80}
            pattern="[a-z0-9][a-z0-9-]{1,78}[a-z0-9]"
            aria-describedby="slug-hint"
          />
          <span id="slug-hint" className="font-sans text-xs text-neutral-500">
            {mode === "edit"
              ? "Locked. The slug is referenced by Stripe metadata — renaming would break webhooks."
              : "Lowercase letters, digits, hyphens. Used in URLs and Stripe metadata. Pick once, keep forever."}
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Name *
          </span>
          <input
            className={fieldClass}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="£75 / month"
            required
            minLength={2}
            maxLength={120}
          />
        </label>
      </div>

      <TextareaField
        label="Description (optional)"
        rows={3}
        hint="One short sentence shown on the marketing card."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Monthly amount (£) *
          </span>
          <input
            className={fieldClass}
            type="number"
            value={amountGBP}
            onChange={(e) => setAmountGBP(e.target.value)}
            min={1}
            step="0.01"
            required
            aria-describedby="amount-hint"
          />
          <span id="amount-hint" className="font-sans text-xs text-neutral-500">
            Customers pay this every month and receive an equivalent amount of Indulgence Credits.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Display order
          </span>
          <input
            className={fieldClass}
            type="number"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            min={0}
            step={1}
          />
          <span className="font-sans text-xs text-neutral-500">
            Lower numbers appear first on /cravings.
          </span>
        </label>
      </div>

      {/*
        Optional tier card image. Uploaded image gets pushed to R2
        and the resulting URL pre-fills the field. The operator can
        also paste an external URL or leave it blank to keep the
        brand-gradient placeholder. Live preview sits above so they
        can see exactly what the public card will use.
      */}
      <fieldset className="border border-cream-200 bg-cream-50 p-4">
        <legend className="px-2 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Tier card image (optional)
        </legend>
        {imageUrl.trim() ? (
          <div
            role="img"
            aria-label="Current tier image"
            className="mb-3 aspect-[3/2] w-full max-w-xs bg-cream-100"
            style={{
              backgroundImage: `url("${imageUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
              Image URL
            </span>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://… (blank = brand gradient placeholder)"
              className={fieldClass}
            />
            <span className="font-sans text-xs italic text-neutral-500">
              Blank = the public site falls back to the brand gradient.
            </span>
          </label>

          <label className="inline-flex items-center justify-center border border-cream-200 bg-paper px-4 py-2 font-display text-base italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                void onFileSelected(e);
              }}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? "Uploading…" : "Upload from device"}
          </label>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 font-sans text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Visible on /cravings (customers can subscribe)
      </label>

      {mode === "edit" && priceChanged ? (
        <Alert variant="warning">
          You&rsquo;ve changed the monthly amount. On save, we&rsquo;ll mint a new Stripe Price and
          archive the old one. Existing subscribers stay on their current price.
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create tier"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/cravings")}
          disabled={pending}
        >
          Cancel
        </Button>
        {mode === "edit" && existing?.active ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onHide}
            disabled={pending}
            className="!text-semantic-danger ml-auto"
          >
            Hide tier
          </Button>
        ) : null}
      </div>
    </form>
  );
}
