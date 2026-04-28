"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import {
  TextField,
  TextareaField,
} from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface InitialPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  coverAlt: string | null;
  authorName: string;
  category: string | null;
  tags: string[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
}

/**
 * PostEditor — split into "Content" and "Meta + SEO" tabs.
 *
 * Body is HTML edited in a textarea for now; sanitised server-side on every
 * save. Phase 6.1 swaps in TipTap (which serialises to HTML — same shape).
 */
export function PostEditor({ initial }: { initial: InitialPost }) {
  const router = useRouter();
  const [tab, setTab] = useState<"content" | "meta">("content");

  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [body, setBody] = useState(initial.body);
  const [authorName, setAuthorName] = useState(initial.authorName);
  const [category, setCategory] = useState(initial.category ?? "");
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl ?? "");
  const [coverAlt, setCoverAlt] = useState(initial.coverAlt ?? "");
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initial.ogImageUrl ?? "");
  const [scheduledFor, setScheduledFor] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const save = async () => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await apiFetch(`/admin/blog/posts/${initial.id}`, {
        method: "PATCH",
        body: {
          title,
          excerpt,
          body,
          authorName,
          ...(category ? { category } : { category: "" }),
          tags,
          ...(coverUrl ? { coverUrl } : { coverUrl: "" }),
          ...(coverAlt ? { coverAlt } : { coverAlt: "" }),
          ...(seoTitle ? { seoTitle } : { seoTitle: "" }),
          ...(seoDescription ? { seoDescription } : { seoDescription: "" }),
          ...(ogImageUrl ? { ogImageUrl } : { ogImageUrl: "" }),
        },
      });
      setSuccess("Draft saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save.");
    } finally {
      setPending(false);
    }
  };

  const publish = async () => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      // Save first to flush any unsaved changes, then publish.
      await save();
      await apiFetch(`/admin/blog/posts/${initial.id}/publish`, {
        method: "POST",
        body: scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {},
      });
      setSuccess(
        scheduledFor
          ? `Scheduled for ${new Date(scheduledFor).toLocaleString()}.`
          : "Published. Public page refreshes within a minute.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to publish.");
    } finally {
      setPending(false);
    }
  };

  const unpublish = async () => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await apiFetch(`/admin/blog/posts/${initial.id}/unpublish`, { method: "POST" });
      setSuccess("Reverted to draft.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to unpublish.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
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

      <div className="mb-4 flex gap-1 border-b border-cream-200">
        <button
          type="button"
          className={`px-4 py-2 font-sans text-sm font-semibold uppercase tracking-[0.16em] ${
            tab === "content"
              ? "border-b-2 border-orange-500 text-maroon-700"
              : "text-neutral-500 hover:text-orange-600"
          }`}
          onClick={() => setTab("content")}
        >
          Content
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-sans text-sm font-semibold uppercase tracking-[0.16em] ${
            tab === "meta"
              ? "border-b-2 border-orange-500 text-maroon-700"
              : "text-neutral-500 hover:text-orange-600"
          }`}
          onClick={() => setTab("meta")}
        >
          Meta &amp; SEO
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          {tab === "content" ? (
            <>
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextareaField
                label="Excerpt"
                rows={3}
                hint="Two or three sentences. Shown on the index."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
              <TextareaField
                label="Body (HTML)"
                rows={20}
                hint="Sanitised server-side. Phase 6.1 swaps this for a TipTap rich-text editor."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </>
          ) : (
            <>
              <TextField
                label="Author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <TextField
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <TextField
                label="Tags"
                hint="Comma-separated."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <TextField
                label="Cover image URL"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
              <TextField
                label="Cover alt text"
                hint="What the cover image shows. Required for accessibility once a cover is set."
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
              />
              <TextField
                label="SEO title (optional)"
                hint="Overrides the article title for search results / social cards."
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
              <TextareaField
                label="SEO description (optional)"
                rows={2}
                hint="Falls back to the excerpt."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
              <TextField
                label="Open Graph image URL (optional)"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
              />
            </>
          )}
        </div>

        <aside className="border border-cream-200 bg-paper p-5">
          <h2 className="m-0 mb-3 font-display text-xl font-medium text-maroon-600">Publishing</h2>

          <Button onClick={() => void save()} variant="secondary" size="sm" block disabled={pending}>
            {pending ? "Saving…" : "Save draft"}
          </Button>

          <div className="mt-4">
            <label className="mb-1 block font-sans text-sm font-medium text-neutral-700">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 pb-2 pt-1 font-sans text-sm focus:border-orange-500 focus:outline-none"
            />
            <p className="mt-1 font-sans text-xs text-neutral-500">
              Leave blank to publish immediately.
            </p>
          </div>

          <div className="mt-4">
            <Button onClick={() => void publish()} block disabled={pending}>
              {scheduledFor ? "Save & schedule" : "Save & publish"}
            </Button>
          </div>

          {initial.status === "PUBLISHED" || initial.status === "SCHEDULED" ? (
            <Button
              onClick={() => void unpublish()}
              variant="ghost"
              size="sm"
              block
              className="mt-3"
              disabled={pending}
            >
              Revert to draft
            </Button>
          ) : null}

          <p className="mt-6 font-sans text-xs text-neutral-500">
            Slug: <span className="font-mono">/{initial.slug}</span>
            <br />
            <a
              href={`/journal/${initial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 underline underline-offset-4"
            >
              Preview public page →
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
