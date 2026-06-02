import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Alert } from "@/components/primitives/Alert";
import { apiFetch } from "@/lib/api";
import { SITE_IMAGE_REGISTRY } from "@/lib/siteImages";

import { ImageSlotEditor } from "./ImageSlotEditor";

export const metadata: Metadata = {
  title: "Admin · Site images",
  robots: { index: false, follow: false },
};

interface SiteImageRow {
  key: string;
  url: string;
  alt: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * Admin "Site images" page — single surface for editing every
 * marketing-site image slot.
 *
 * Layout:
 *   - Sections by group ("Heroes", "Service cards", etc.) derived
 *     from the registry.
 *   - Each slot renders an `ImageSlotEditor` tile with: a thumbnail
 *     preview (showing the override if set, otherwise the code-
 *     level default), the file-upload control, the alt-text input,
 *     a Save button, and a "Reset to default" button if an override
 *     exists.
 *
 * Read path:
 *   - Server-side fetch of all override rows via the admin endpoint
 *     so we can include `updatedAt` / `updatedBy` for any future
 *     "who changed this and when" surface. Each slot tile gets the
 *     row that matches its key (or undefined if not overridden).
 */
export default async function AdminSiteImagesPage() {
  const cookieHeader = (await cookies()).toString();

  let overrides = new Map<string, SiteImageRow>();
  let loadError: string | null = null;
  try {
    const rows = await apiFetch<SiteImageRow[]>("/admin/site-images", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    overrides = new Map(rows.map((r) => [r.key, r]));
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Couldn't load image overrides.";
  }

  // Group the registry by section for display, preserving the
  // order of the first occurrence of each group in the registry
  // array. That gives the operator a deterministic top-to-bottom
  // reading order without needing a separate sort definition.
  const seenGroups = new Set<string>();
  const groupOrder: string[] = [];
  for (const entry of SITE_IMAGE_REGISTRY) {
    if (!seenGroups.has(entry.group)) {
      seenGroups.add(entry.group);
      groupOrder.push(entry.group);
    }
  }
  const grouped = groupOrder.map((group) => ({
    group,
    entries: SITE_IMAGE_REGISTRY.filter((e) => e.group === group),
  }));

  return (
    <>
      <p className="eyebrow mb-2">Site</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">
        Images
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Replace any image on the public site. Changes go live within ~60
        seconds. Empty slots fall back to the photography committed in code, so
        the site never breaks while you&rsquo;re working.
      </p>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {grouped.map(({ group, entries }) => (
        <section key={group} className="mb-12">
          <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
            {group}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <ImageSlotEditor
                key={entry.key}
                slotKey={entry.key}
                label={entry.label}
                context={entry.context}
                fallback={entry.fallback}
                defaultAlt={entry.defaultAlt ?? entry.label}
                override={overrides.get(entry.key) ?? null}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
