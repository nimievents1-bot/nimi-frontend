"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { useConfirm } from "@/components/patterns/ConfirmDialog";
import { ApiError, apiFetch } from "@/lib/api";

interface OverrideRow {
  key: string;
  url: string;
  alt: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

interface Props {
  slotKey: string;
  label: string;
  context: string;
  fallback: string;
  defaultAlt: string;
  override: OverrideRow | null;
}

/**
 * Single image-slot tile rendered inside the admin "Site images"
 * page. Three states it can be in:
 *
 *   1. No override → preview shows the code-level fallback. Upload
 *      + Save publishes a new override.
 *   2. Override exists, no edits pending → preview shows the
 *      override. "Reset to default" button appears.
 *   3. Mid-edit (user picked a file or changed alt text) → Save
 *      becomes the primary action and the form remembers the
 *      pending state until they commit.
 *
 * Upload pipeline: posts the file to `/api/upload/image` (existing
 * R2 route used by the pastry / collection editors). On success
 * we use the returned URL to populate the URL field but don't
 * publish it yet — the operator clicks "Save" to commit, so they
 * can change the alt text or back out before the public site
 * sees the new image.
 */
export function ImageSlotEditor({
  slotKey,
  label,
  context,
  fallback,
  defaultAlt,
  override,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  // `pendingUrl` starts at the override's URL (or empty); the
  // operator overwrites it via the upload control or by editing
  // the text field directly.
  const [pendingUrl, setPendingUrl] = useState<string>(override?.url ?? "");
  const [pendingAlt, setPendingAlt] = useState<string>(override?.alt ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // The image we show in the preview area, in priority order:
  //   - the URL the operator just typed/uploaded
  //   - the existing override URL
  //   - the code-level fallback
  //
  // We can't use `??` here because an empty trimmed string IS a
  // valid "fall through" signal — the operator may have backspaced
  // the URL field to blank, and we want the preview to drop back to
  // the existing override (or fallback) rather than render an
  // `<img>` with src="". Explicit length check sidesteps the
  // `prefer-nullish-coalescing` lint rule for this specific case.
  const trimmedPendingUrl = pendingUrl.trim();
  const previewSrc =
    trimmedPendingUrl.length > 0
      ? trimmedPendingUrl
      : override?.url ?? fallback;

  // True when the operator has unsaved changes vs whatever's in the
  // DB right now. Drives the Save button's enabled state.
  const hasPendingChanges =
    pendingUrl.trim() !== (override?.url ?? "") ||
    pendingAlt !== (override?.alt ?? "");

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
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
      setPendingUrl(data.url);
      // Friendly "we shrunk your image" feedback so the operator
      // knows the upload pipeline actually did something.
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
          `Uploaded · ${kb(data.originalBytes)} → ${kb(data.optimisedBytes)}` +
            (pct > 0 ? ` (${pct}% smaller)` : "") +
            ". Click Save to publish.",
        );
      } else {
        setSuccess("Uploaded. Click Save to publish.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      // Reset the file input so re-picking the same file fires onChange again.
      e.target.value = "";
    }
  };

  const onSave = async () => {
    if (!pendingUrl.trim()) {
      setError("Pick or paste an image URL before saving.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/admin/site-images/${encodeURIComponent(slotKey)}`, {
        method: "PUT",
        body: {
          url: pendingUrl.trim(),
          // Treat empty alt as "use the registry default" → send null.
          alt: pendingAlt.trim() ? pendingAlt.trim() : null,
        },
      });
      setSuccess("Saved. Public site will pick this up within a minute.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    if (!override) return;
    const confirmed = await confirm({
      title: `Reset "${label}" to default?`,
      description:
        "Your uploaded image will be removed and the original photography committed in code will be used again. You can re-upload at any time.",
      confirmLabel: "Reset",
      cancelLabel: "Keep my upload",
      variant: "danger",
    });
    if (!confirmed) return;
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/admin/site-images/${encodeURIComponent(slotKey)}`, {
        method: "DELETE",
      });
      setPendingUrl("");
      setPendingAlt("");
      setSuccess("Reset. Default photography is back on the public site.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't reset.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="border border-cream-200 bg-paper p-4">
      {/* Slot header. Label first, then a smaller subtitle telling
          the operator WHERE this image appears on the public site.
          Without the context line, "Catering card (home)" vs
          "Catering hero" is too easy to confuse. */}
      <header className="mb-3">
        <p className="m-0 font-display text-base font-medium text-maroon-700">
          {label}
        </p>
        <p className="m-0 mt-1 font-sans text-xs italic text-neutral-500">
          {context}
        </p>
        <p className="m-0 mt-2 font-mono text-2xs text-neutral-400">
          {slotKey}
        </p>
      </header>

      {/* Preview. Aspect-3/2 so portrait, landscape, and square
          uploads all read OK without separate per-slot config. */}
      <div
        role="img"
        aria-label={pendingAlt || defaultAlt}
        className="mb-3 aspect-[3/2] w-full bg-cream-100"
        style={{
          backgroundImage: `url("${previewSrc}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {error ? (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" className="mb-3">
          {success}
        </Alert>
      ) : null}

      <div className="space-y-2">
        <label className="block">
          <span className="block font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Image URL
          </span>
          <input
            type="url"
            value={pendingUrl}
            onChange={(e) => setPendingUrl(e.target.value)}
            placeholder={`Default: ${fallback}`}
            className="w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-xs focus:border-orange-500 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="block font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Alt text
          </span>
          <input
            type="text"
            value={pendingAlt}
            onChange={(e) => setPendingAlt(e.target.value)}
            placeholder={defaultAlt}
            maxLength={240}
            className="w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-xs focus:border-orange-500 focus:outline-none"
          />
        </label>

        <label className="inline-flex w-full cursor-pointer items-center justify-center border border-cream-200 bg-cream-50 px-3 py-2 font-display text-sm italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              void onFileSelected(e);
            }}
            disabled={uploading || saving}
            className="sr-only"
          />
          {uploading ? "Uploading…" : "Upload from device"}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!hasPendingChanges || saving || uploading}
          onClick={() => {
            void onSave();
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        {override ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saving || uploading}
            onClick={() => {
              void onReset();
            }}
          >
            Reset to default
          </Button>
        ) : null}
      </div>
    </article>
  );
}
