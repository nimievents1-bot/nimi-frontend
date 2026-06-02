"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { useConfirm } from "@/components/patterns/ConfirmDialog";
import { ApiError, apiFetch } from "@/lib/api";

type Category = "CATERING" | "EVENTS";

export interface ServiceTierRow {
  id: string;
  category: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: unknown;
  imageUrl: string | null;
  flagship: boolean;
  position: number;
  active: boolean;
}

interface Props {
  mode: "create" | "edit";
  row?: ServiceTierRow;
}

/**
 * Shared create + edit form for `ServiceTier`. Bullets come in as a
 * comma-or-newline string for ergonomics and are split on submit —
 * operators don't have to type JSON. Image upload posts to the
 * existing R2 pipeline so the same upload route serves every
 * admin-managed photograph on the site.
 */
export function ServiceTierEditor({ mode, row }: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  const initialBullets = Array.isArray(row?.bullets)
    ? (row.bullets as unknown[])
        .map((b) => (typeof b === "string" ? b : String(b)))
        .join("\n")
    : "";

  const [category, setCategory] = useState<Category>(
    (row?.category as Category) ?? "CATERING",
  );
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [eyebrow, setEyebrow] = useState(row?.eyebrow ?? "");
  const [title, setTitle] = useState(row?.title ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [bulletsText, setBulletsText] = useState(initialBullets);
  const [imageUrl, setImageUrl] = useState(row?.imageUrl ?? "");
  const [flagship, setFlagship] = useState(row?.flagship ?? false);
  const [position, setPosition] = useState<string>(
    row ? String(row.position) : "0",
  );
  const [active, setActive] = useState<boolean>(
    mode === "create" ? true : row?.active ?? true,
  );

  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

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
      };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed.");
      }
      setImageUrl(data.url);
      setSuccess("Image uploaded. Click Save to apply.");
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

    const bullets = bulletsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setPending(true);

    const payload = {
      category,
      slug: slug.trim(),
      eyebrow: eyebrow.trim(),
      title: title.trim(),
      description: description.trim(),
      bullets,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      flagship,
      position: Number(position) || 0,
      active,
    };

    try {
      if (mode === "create") {
        const created = await apiFetch<{ id: string }>(
          "/admin/service-tiers",
          { method: "POST", body: payload },
        );
        router.push(`/admin/tiers/${created.id}`);
        router.refresh();
      } else if (row) {
        await apiFetch(`/admin/service-tiers/${row.id}`, {
          method: "PATCH",
          body: payload,
        });
        setSuccess("Saved.");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save tier.");
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!row) return;
    const confirmed = await confirm({
      title: `Delete "${row.title}"?`,
      description:
        "Removes the tier permanently. If a booking link references this slug it will 404. Consider toggling Active off instead.",
      confirmLabel: "Delete",
      cancelLabel: "Keep it",
      variant: "danger",
    });
    if (!confirmed) return;
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/admin/service-tiers/${row.id}`, { method: "DELETE" });
      router.push("/admin/tiers");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't delete.");
      setPending(false);
    }
  };

  return (
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
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={fieldClass}
          >
            <option value="CATERING">Catering</option>
            <option value="EVENTS">Events</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Slug
          </span>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. buffet, family-style, coordination"
            className={fieldClass}
          />
          <span className="font-sans text-xs italic text-neutral-500">
            Used in booking links (`?tier=...`). Keep stable once set.
          </span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Eyebrow
          </span>
          <input
            type="text"
            required
            maxLength={80}
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="e.g. Tier 1, Tier 2, Flagship"
            className={fieldClass}
          />
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
          Title
        </span>
        <input
          type="text"
          required
          maxLength={160}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Buffet Service"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Description
        </span>
        <textarea
          required
          rows={3}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          What&rsquo;s included (one line per bullet)
        </span>
        <textarea
          rows={6}
          value={bulletsText}
          onChange={(e) => setBulletsText(e.target.value)}
          placeholder={"Seasonal menu\nFull set-up + service\nPost-event cleardown"}
          className={fieldClass}
        />
      </label>

      <fieldset className="border border-cream-200 bg-cream-50 p-4">
        <legend className="px-2 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Tier card image
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
              Blank = the public page falls back to the brand-gradient placeholder.
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

      <div className="flex flex-wrap gap-6">
        <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={flagship}
            onChange={(e) => setFlagship(e.target.checked)}
            className="h-4 w-4 accent-orange-600"
          />
          Flagship (highlighted card)
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-orange-600"
          />
          Active (visible on public site)
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create tier" : "Save changes"}
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
