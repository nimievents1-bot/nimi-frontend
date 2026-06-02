import { apiFetch } from "@/lib/api";

/**
 * SITE SETTINGS REGISTRY
 * ======================
 *
 * Same pattern as `SITE_IMAGE_REGISTRY` but for editable text
 * snippets. Every admin-editable string on the marketing site
 * gets an entry here with a stable key, a human-readable label,
 * a group for the admin UI's section dividers, the context line
 * telling the operator where the string appears, and the
 * code-level fallback used until the operator overrides it.
 *
 * Adding a new editable setting:
 *
 *   1. Append a row to this array.
 *   2. In the page where you use the string, replace the literal
 *      with `await siteSetting("your.key")`.
 *
 * The admin "Site settings" page auto-discovers new entries on
 * next deploy. No migration per setting.
 */

export interface SiteSettingRegistryEntry {
  /** Stable lookup key — used as `SiteSetting.key` on the API. */
  key: string;
  /** Human-readable label shown on the admin tile. */
  label: string;
  /** Group divider on the admin "Site settings" page. */
  group: string;
  /** Where this string surfaces on the public site (operator hint). */
  context: string;
  /** Default value used when no override exists. */
  fallback: string;
  /** Whether the admin should render a textarea instead of a single-line input. */
  multiline?: boolean;
}

export const SITE_SETTINGS_REGISTRY: readonly SiteSettingRegistryEntry[] = [
  // ============================================================
  // Gifting — production timeline copy.
  //
  // Two related strings: a short tag-style pill ("Production 6–12 wks")
  // and a longer lede sentence ("Production time is six to twelve
  // weeks…"). They live next to each other on the gifting page; the
  // operator edits both from the same admin tile cluster.
  // ============================================================
  {
    key: "gifting.production-timeline.pill",
    label: "Production timeline pill",
    group: "Gifting",
    context: "The orange tag near the top of /gifting (e.g. \"Production 6–12 wks\")",
    fallback: "Production 6–12 wks",
  },
  {
    key: "gifting.production-timeline.lede",
    label: "Production timeline lede",
    group: "Gifting",
    context:
      "The descriptive line in the /gifting hero (e.g. \"Production time is six to twelve weeks depending on complexity…\")",
    fallback:
      "Production time is six to twelve weeks depending on complexity — every item is custom and made to order.",
    multiline: true,
  },
];

interface SiteSettingRow {
  key: string;
  value: string;
}

/**
 * Cached fetch of every override. Same 60-second TTL as
 * `siteImages.ts` for the same reasons: marketing renders are
 * frequent, override table changes are rare, fail-open behaviour
 * keeps the public site rendering on transient API errors.
 */
let cachedOverrides: Map<string, string> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadOverrides(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedOverrides && now - cachedAt < CACHE_TTL_MS) {
    return cachedOverrides;
  }
  try {
    const rows = await apiFetch<SiteSettingRow[]>("/site-settings", {
      method: "GET",
      cache: "no-store",
    });
    cachedOverrides = new Map(rows.map((r) => [r.key, r.value]));
    cachedAt = now;
    return cachedOverrides;
  } catch {
    // Failover: return the most recent successful load, or an empty
    // map. Public site keeps rendering code-level defaults.
    return cachedOverrides ?? new Map();
  }
}

/**
 * Resolve a single setting. Returns the admin override if set,
 * otherwise the code-level fallback.
 *
 * Usage:
 *   const pill = await siteSetting("gifting.production-timeline.pill");
 */
export async function siteSetting(key: string): Promise<string> {
  const entry = SITE_SETTINGS_REGISTRY.find((r) => r.key === key);
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `siteSetting("${key}") is not in SITE_SETTINGS_REGISTRY. Add it to nimi-web/src/lib/siteSettings.ts.`,
      );
    }
    return "";
  }
  const overrides = await loadOverrides();
  return overrides.get(key) ?? entry.fallback;
}

/**
 * Bulk variant. When a page renders many settings, fetching once
 * is cheaper than calling `siteSetting` repeatedly.
 */
export async function siteSettings(
  ...keys: string[]
): Promise<Record<string, string>> {
  const overrides = await loadOverrides();
  const out: Record<string, string> = {};
  for (const key of keys) {
    const entry = SITE_SETTINGS_REGISTRY.find((r) => r.key === key);
    out[key] = overrides.get(key) ?? entry?.fallback ?? "";
  }
  return out;
}
