"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField, TextareaField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface InitialBlock {
  id: string;
  page: string;
  key: string;
  locale: string;
  type: string;
  payload: Record<string, unknown>;
  publishedAt: string | null;
}

/**
 * ContentEditor — a small, type-aware editor.
 *
 * For Phase 2 we ship editors for the two most-used block types:
 *   - hero       — image, alt, eyebrow, headline, subheadline, CTA
 *   - richtext   — single sanitised HTML field
 *
 * Other block types fall back to a JSON textarea so the founder isn't
 * blocked. Phase 2.1 will add structured editors for section-intro,
 * package-tier, faq, gallery, testimonial.
 */
export function ContentEditor({ initial }: { initial: InitialBlock }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Small typed view-models per block type.
  const [heroState, setHeroState] = useState(() => initialHero(initial));
  const [richTextState, setRichTextState] = useState<string>(
    initial.type === "richtext" ? String(initial.payload.html ?? "") : "",
  );
  const [jsonState, setJsonState] = useState<string>(
    JSON.stringify(initial.payload, null, 2),
  );

  const buildPayload = (): Record<string, unknown> => {
    if (initial.type === "hero") {
      return {
        imageUrl: heroState.imageUrl || null,
        alt: heroState.alt,
        eyebrow: heroState.eyebrow || null,
        headline: heroState.headline,
        subheadline: heroState.subheadline || null,
        primaryCta:
          heroState.ctaLabel && heroState.ctaHref
            ? { label: heroState.ctaLabel, href: heroState.ctaHref }
            : null,
      };
    }
    if (initial.type === "richtext") {
      return { html: richTextState };
    }
    return JSON.parse(jsonState) as Record<string, unknown>;
  };

  const submit = async (publish: boolean) => {
    setServerError(null);
    setServerSuccess(null);
    setPending(true);
    try {
      const payload = buildPayload();
      const draft = await apiFetch<{ id: string }>("/content/admin/draft", {
        method: "POST",
        body: {
          page: initial.page,
          key: initial.key,
          locale: initial.locale,
          type: initial.type,
          payload,
        },
      });
      if (publish) {
        await apiFetch(`/content/admin/publish/${draft.id}`, { method: "POST" });
        setServerSuccess("Draft saved and published. Public pages refresh within a minute.");
      } else {
        setServerSuccess("Draft saved. Click Publish when you're ready to take it live.");
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.detail);
      } else if (err instanceof SyntaxError) {
        setServerError("The JSON payload is malformed — fix the structure and try again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {serverError ? (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      ) : null}
      {serverSuccess ? (
        <Alert variant="success" className="mb-4">
          {serverSuccess}
        </Alert>
      ) : null}

      {initial.type === "hero" ? (
        <HeroEditor state={heroState} onChange={setHeroState} />
      ) : initial.type === "richtext" ? (
        <RichTextEditor html={richTextState} onChange={setRichTextState} />
      ) : (
        <RawJsonEditor json={jsonState} onChange={setJsonState} />
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={() => void submit(false)} variant="secondary" disabled={pending}>
          Save draft
        </Button>
        <Button onClick={() => void submit(true)} variant="primary" disabled={pending}>
          {pending ? "Working…" : "Save & publish"}
        </Button>
      </div>
    </div>
  );
}

interface HeroState {
  imageUrl: string;
  alt: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
}

function initialHero(b: InitialBlock): HeroState {
  if (b.type !== "hero") {
    return {
      imageUrl: "",
      alt: "",
      eyebrow: "",
      headline: "",
      subheadline: "",
      ctaLabel: "",
      ctaHref: "",
    };
  }
  const p = b.payload as Record<string, unknown>;
  const cta = (p.primaryCta as { label?: string; href?: string } | null) ?? null;
  return {
    imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : "",
    alt: typeof p.alt === "string" ? p.alt : "",
    eyebrow: typeof p.eyebrow === "string" ? p.eyebrow : "",
    headline: typeof p.headline === "string" ? p.headline : "",
    subheadline: typeof p.subheadline === "string" ? p.subheadline : "",
    ctaLabel: cta?.label ?? "",
    ctaHref: cta?.href ?? "",
  };
}

function HeroEditor({
  state,
  onChange,
}: {
  state: HeroState;
  onChange: (next: HeroState) => void;
}) {
  const set = <K extends keyof HeroState>(k: K, v: HeroState[K]) => onChange({ ...state, [k]: v });
  return (
    <>
      <TextField
        label="Image URL"
        hint="A full https URL. Leave blank to fall back to the brand gradient."
        value={state.imageUrl}
        onChange={(e) => set("imageUrl", e.target.value)}
      />
      <TextField
        label="Alt text"
        required
        hint="What the image shows. Read aloud by screen readers — be descriptive."
        value={state.alt}
        onChange={(e) => set("alt", e.target.value)}
      />
      <TextField
        label="Eyebrow"
        hint="Small uppercase line above the headline."
        value={state.eyebrow}
        onChange={(e) => set("eyebrow", e.target.value)}
      />
      <TextField
        label="Headline"
        required
        value={state.headline}
        onChange={(e) => set("headline", e.target.value)}
      />
      <TextField
        label="Sub-headline"
        hint="One line in italic serif beneath the headline."
        value={state.subheadline}
        onChange={(e) => set("subheadline", e.target.value)}
      />
      <div className="mt-4 grid grid-cols-1 gap-x-6 md:grid-cols-2">
        <TextField
          label="CTA label"
          value={state.ctaLabel}
          onChange={(e) => set("ctaLabel", e.target.value)}
        />
        <TextField
          label="CTA link"
          value={state.ctaHref}
          onChange={(e) => set("ctaHref", e.target.value)}
        />
      </div>
    </>
  );
}

function RichTextEditor({ html, onChange }: { html: string; onChange: (next: string) => void }) {
  return (
    <TextareaField
      label="HTML body"
      hint="HTML allowed; will be sanitised server-side. Phase 2.1 will replace this with a TipTap rich-text editor."
      rows={12}
      value={html}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function RawJsonEditor({ json, onChange }: { json: string; onChange: (next: string) => void }) {
  return (
    <TextareaField
      label="Block payload (JSON)"
      hint="Structured editor for this block type ships in Phase 2.1. For now, edit the raw JSON. Server validation will reject malformed payloads."
      rows={20}
      value={json}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
