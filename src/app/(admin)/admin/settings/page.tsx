import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Alert } from "@/components/primitives/Alert";
import { apiFetch } from "@/lib/api";
import { SITE_SETTINGS_REGISTRY } from "@/lib/siteSettings";

import { SettingEditor } from "./SettingEditor";

export const metadata: Metadata = {
  title: "Admin · Site settings",
  robots: { index: false, follow: false },
};

interface SettingRow {
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * Admin "Site settings" page — single surface for editing every
 * registered text snippet on the marketing site. Direct sibling
 * of `/admin/images`: same registry-driven layout, same in-place
 * editor pattern, just for text instead of image URLs.
 *
 * Reads every override row up-front so each tile knows whether
 * an admin-set value exists (changes the visible "Reset" affordance)
 * or only the code-level fallback is in play.
 */
export default async function AdminSiteSettingsPage() {
  const cookieHeader = (await cookies()).toString();

  let overrides = new Map<string, SettingRow>();
  let loadError: string | null = null;
  try {
    const rows = await apiFetch<SettingRow[]>("/admin/site-settings", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    overrides = new Map(rows.map((r) => [r.key, r]));
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Couldn't load site settings.";
  }

  // Preserve the order of first occurrence of each group in the
  // registry array. Same deterministic-grouping trick as the
  // images admin page.
  const seenGroups = new Set<string>();
  const groupOrder: string[] = [];
  for (const entry of SITE_SETTINGS_REGISTRY) {
    if (!seenGroups.has(entry.group)) {
      seenGroups.add(entry.group);
      groupOrder.push(entry.group);
    }
  }
  const grouped = groupOrder.map((group) => ({
    group,
    entries: SITE_SETTINGS_REGISTRY.filter((e) => e.group === group),
  }));

  return (
    <>
      <p className="eyebrow mb-2">Site</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">
        Settings
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Editable text snippets shown across the public marketing site. Changes
        go live within ~60 seconds. Empty overrides fall back to the wording
        committed in code, so the public site never renders blank.
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
          <div className="grid gap-6 lg:grid-cols-2">
            {entries.map((entry) => (
              <SettingEditor
                key={entry.key}
                settingKey={entry.key}
                label={entry.label}
                context={entry.context}
                fallback={entry.fallback}
                multiline={entry.multiline ?? false}
                override={overrides.get(entry.key) ?? null}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
