"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { ApiError, apiFetch } from "@/lib/api";

interface TestimonialRow {
  id: string;
  authorName: string;
  role: string | null;
  body: string;
  rating: number | null;
  eventType: string | null;
  isPublished: boolean;
  displayOrder: number;
}

type Mode = "create" | "edit";

interface TestimonialEditorProps {
  mode: Mode;
  row?: TestimonialRow;
}

/**
 * TestimonialEditor — create-and-edit form for `/admin/testimonials`.
 *
 * Two modes:
 *   - "create": minimal form for adding a new row, defaults to draft.
 *   - "edit": pre-fills with the row's current values and shows a destructive
 *     delete control alongside save/publish toggles.
 *
 * Implementation notes:
 *   - We use plain HTML inputs + local state to keep the editor lean — this
 *     surface only ever has one editor mounted in the listing context, and
 *     react-hook-form's bundle isn't worth the cost for a 7-field form.
 *   - The API enforces all field validation (length, ranges) so the form
 *     can stay forgiving and let the server send back errors as needed.
 */
export function TestimonialEditor({ mode, row }: TestimonialEditorProps) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState(row?.authorName ?? "");
  const [role, setRole] = useState(row?.role ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [rating, setRating] = useState<string>(row?.rating ? String(row.rating) : "");
  const [eventType, setEventType] = useState(row?.eventType ?? "");
  const [isPublished, setIsPublished] = useState<boolean>(row?.isPublished ?? false);
  const [displayOrder, setDisplayOrder] = useState<string>(
    row?.displayOrder !== undefined ? String(row.displayOrder) : "0",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    if (mode === "create") {
      setAuthorName("");
      setRole("");
      setBody("");
      setRating("");
      setEventType("");
      setIsPublished(false);
      setDisplayOrder("0");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    const payload = {
      authorName: authorName.trim(),
      role: role.trim() || undefined,
      body: body.trim(),
      rating: rating ? Number(rating) : undefined,
      eventType: eventType.trim() || undefined,
      isPublished,
      displayOrder: Number(displayOrder) || 0,
    };

    try {
      if (mode === "create") {
        await apiFetch("/admin/testimonials", { method: "POST", body: payload });
        setSuccess("Testimonial created.");
        reset();
      } else if (row) {
        await apiFetch(`/admin/testimonials/${row.id}`, { method: "PATCH", body: payload });
        setSuccess("Saved.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't save the testimonial.");
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!row) return;
    const confirmed = window.confirm(
      `Delete the testimonial from "${row.authorName}"? This can't be undone.`,
    );
    if (!confirmed) return;
    setError(null);
    setPending(true);
    try {
      await apiFetch(`/admin/testimonials/${row.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't delete.");
      setPending(false);
    }
  };

  const fieldClass =
    "w-full border border-cream-200 bg-paper px-3 py-2 font-sans text-sm focus:border-orange-500 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : null}
      {success ? (
        <Alert variant="success">{success}</Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Display name (consented)
          </span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Role / context (optional)
          </span>
          <input
            type="text"
            maxLength={120}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Wedding · Sept 2025"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Quote
        </span>
        <textarea
          required
          minLength={20}
          maxLength={1000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Rating (1–5, optional)
          </span>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={fieldClass}
          >
            <option value="">No rating</option>
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★☆ (4)</option>
            <option value="3">★★★☆☆ (3)</option>
            <option value="2">★★☆☆☆ (2)</option>
            <option value="1">★☆☆☆☆ (1)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Event type (optional)
          </span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className={fieldClass}
          >
            <option value="">—</option>
            <option value="wedding">Wedding</option>
            <option value="corporate">Corporate</option>
            <option value="birthday">Birthday</option>
            <option value="private">Private</option>
            <option value="gifting">Gifting</option>
            <option value="subscription">Indulgence Club</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
            Display order (lower = earlier)
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

      <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Publish (visible on homepage)
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Add testimonial" : "Save changes"}
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
