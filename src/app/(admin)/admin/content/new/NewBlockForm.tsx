"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { SelectField, TextField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

const PAGES = [
  "home",
  "catering",
  "events",
  "gifting",
  "cravings",
  "about",
  "faq",
  "contact",
  "privacy",
  "terms",
  "cookies",
  "site",
] as const;

const TYPES = [
  { value: "hero", label: "Hero — image, eyebrow, headline, sub-headline, CTA" },
  { value: "richtext", label: "Rich text — HTML body" },
  { value: "section-intro", label: "Section intro — eyebrow, title, body, image" },
  { value: "package-tier", label: "Package tier — name, description, includes, price" },
  { value: "faq", label: "FAQ — list of question / answer pairs" },
  { value: "gallery", label: "Gallery — list of images with alt and caption" },
  { value: "testimonial", label: "Testimonial — quote, author, role" },
  { value: "footer", label: "Footer — about, contact, social" },
] as const;

const minimalDefaults: Record<string, Record<string, unknown>> = {
  hero: {
    imageUrl: null,
    alt: "",
    eyebrow: null,
    headline: "Headline goes here",
    subheadline: null,
    primaryCta: null,
  },
  richtext: { html: "<p>Write something…</p>" },
  "section-intro": { eyebrow: null, title: "Title", body: "Body copy", imageUrl: null },
  "package-tier": {
    name: "Tier",
    position: 1,
    description: "Description",
    includes: [],
    priceFrom: null,
    ctaLabel: "Enquire",
  },
  faq: { items: [{ question: "Question?", answer: "Answer." }] },
  gallery: { images: [] },
  testimonial: { quote: "Quote", author: "Author", role: null, imageUrl: null },
  footer: { about: "About", phone: "", email: "hello@nimievents.co.uk", social: null },
};

export function NewBlockForm() {
  const router = useRouter();

  const [page, setPage] = useState<string>("home");
  const [key, setKey] = useState("");
  const [type, setType] = useState<string>("hero");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);

    const trimmedKey = key.trim();
    if (!trimmedKey || !/^[a-z0-9-]+$/.test(trimmedKey)) {
      setError("Key must use lowercase letters, numbers and hyphens (e.g. `hero` or `intro-1`).");
      return;
    }

    setPending(true);
    try {
      const payload = minimalDefaults[type] ?? {};
      await apiFetch<{ id: string }>("/content/admin/draft", {
        method: "POST",
        body: { page, key: trimmedKey, type, payload },
      });
      router.push(`/admin/content/${page}/${trimmedKey}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to create block.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-xl">
      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <SelectField label="Page" value={page} onChange={(e) => setPage(e.target.value)}>
        {PAGES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Key"
        required
        hint="Short identifier within the page (e.g. `hero`, `intro`, `footer-about`). Lowercase letters, numbers, hyphens."
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />

      <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value)}>
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </SelectField>

      <Button onClick={() => void submit()} disabled={pending}>
        {pending ? "Creating…" : "Create draft"}
      </Button>
      <p className="mt-3 font-sans text-xs text-neutral-500">
        We&rsquo;ll create the draft and take you to the editor.
      </p>
    </div>
  );
}
