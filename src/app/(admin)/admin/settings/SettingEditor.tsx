"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { useConfirm } from "@/components/patterns/ConfirmDialog";
import { ApiError, apiFetch } from "@/lib/api";

interface OverrideRow {
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

interface Props {
  settingKey: string;
  label: string;
  context: string;
  fallback: string;
  multiline: boolean;
  override: OverrideRow | null;
}

/**
 * Single setting tile rendered inside the admin "Site settings"
 * page. Modelled exactly on `ImageSlotEditor`, just with a text
 * input instead of a file upload.
 *
 * Three states it can be in:
 *   1. No override → input prefilled with the code-level fallback
 *      (read-only-looking but editable). Save publishes a new
 *      override.
 *   2. Override exists, no pending edits → input shows the
 *      current override. "Reset to default" appears.
 *   3. Mid-edit (input differs from saved state) → Save is the
 *      primary action.
 *
 * The fallback is shown as the placeholder so the operator always
 * knows what the site WILL display if they clear the field, even
 * after they've started typing.
 */
export function SettingEditor({
  settingKey,
  label,
  context,
  fallback,
  multiline,
  override,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();

  // Initial value of the input box. When an override exists, show
  // that; otherwise, the input starts blank so the operator can
  // type the new value directly without erasing the fallback first.
  const [pending, setPending] = useState<string>(override?.value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // What the public site will render right now. Operator hint
  // shown below the input so they know what they're replacing.
  const livePreview = override?.value ?? fallback;

  // True when the input differs from whatever's saved in the DB.
  // Drives the Save button's enabled state.
  const hasPendingChanges = pending !== (override?.value ?? "");

  const onSave = async () => {
    if (!pending.trim()) {
      setError("Setting can't be empty. To restore the default, click Reset to default.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/admin/site-settings/${encodeURIComponent(settingKey)}`, {
        method: "PUT",
        body: { value: pending },
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
        "Your edited text will be removed and the wording committed in code will be shown on the public site again. You can re-edit at any time.",
      confirmLabel: "Reset",
      cancelLabel: "Keep my version",
      variant: "danger",
    });
    if (!confirmed) return;
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/admin/site-settings/${encodeURIComponent(settingKey)}`, {
        method: "DELETE",
      });
      setPending("");
      setSuccess("Reset. Default wording is back on the public site.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't reset.");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

  return (
    <article className="border border-cream-200 bg-paper p-4">
      <header className="mb-3">
        <p className="m-0 font-display text-base font-medium text-maroon-700">
          {label}
        </p>
        <p className="m-0 mt-1 font-sans text-xs italic text-neutral-500">
          {context}
        </p>
        <p className="m-0 mt-2 font-mono text-2xs text-neutral-400">
          {settingKey}
        </p>
      </header>

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

      <label className="block">
        <span className="block font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          {override ? "Current value" : "New value (empty = use default)"}
        </span>
        {multiline ? (
          <textarea
            rows={3}
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            placeholder={fallback}
            maxLength={8000}
            className={fieldClass}
          />
        ) : (
          <input
            type="text"
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            placeholder={fallback}
            maxLength={8000}
            className={fieldClass}
          />
        )}
      </label>

      {/* Live-preview line. Shows what the public site is rendering
          right now, AS IT WILL APPEAR (not the pending edit). Helps
          the operator orient when they're not sure what they're
          replacing. */}
      <p className="mt-2 max-w-prose font-sans text-xs italic text-neutral-500">
        Currently on the site: &ldquo;{livePreview}&rdquo;
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!hasPendingChanges || saving}
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
            disabled={saving}
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
