import { apiFetch } from "@/lib/api";

import { images } from "./images";

/**
 * SITE IMAGE REGISTRY
 * ===================
 *
 * Every marketing-page image slot the admin can replace is listed
 * here, with a stable `key`, a human-readable `label`, a `group`
 * for the admin UI's section dividers, and the code-level
 * `fallback` URL the public site uses when no admin override
 * exists yet.
 *
 * Adding a new editable slot is two steps:
 *
 *   1. Append a row to this array. Pick a stable, dot-segmented
 *      key (`hero.about`, `services.gifting`, etc.).
 *   2. In the page where you use the image, replace
 *      `images.foo.bar` with `await siteImage("foo.bar")`.
 *
 * The admin's "Site images" page will automatically pick up the
 * new key on next deploy. No DB migration per image.
 *
 * Why a registry rather than per-image DB rows from the start:
 *   - The admin UI needs to know WHICH keys exist before any rows
 *     have been written, so it can show "this slot is editable
 *     but hasn't been overridden yet".
 *   - The fallback URL belongs to the code, not the database —
 *     if we lose the DB tomorrow, the site still has all its
 *     original photography.
 *   - Groups + labels are presentational concerns and shouldn't
 *     pollute the data layer.
 */

export interface SiteImageRegistryEntry {
  /** Stable key. Used as the SiteImage.key PK on the API side. */
  key: string;
  /** Human-readable label shown in the admin UI. */
  label: string;
  /** Section divider in the admin UI ("Heroes", "Service cards", etc.). */
  group: string;
  /** Where this image appears (helps the operator orient). */
  context: string;
  /** Code-level default. Public site renders this if no override exists. */
  fallback: string;
  /** Default alt text. Falls back to label if not set. */
  defaultAlt?: string;
}

export const SITE_IMAGE_REGISTRY: readonly SiteImageRegistryEntry[] = [
  // ============================================================
  // Hero banners — the big top-of-page photograph on every public page.
  // ============================================================
  {
    key: "hero.home",
    label: "Home page hero",
    group: "Hero banners",
    context: "Banner shown at the top of /",
    fallback: images.hero.home,
    defaultAlt: "Nimi Events — catering, events, gifting",
  },
  {
    key: "hero.catering",
    label: "Catering hero",
    group: "Hero banners",
    context: "Banner shown at the top of /catering",
    fallback: images.hero.catering,
  },
  {
    key: "hero.events",
    label: "Events hero",
    group: "Hero banners",
    context: "Banner shown at the top of /events",
    fallback: images.hero.events,
  },
  {
    key: "hero.gifting",
    label: "Gifting hero",
    group: "Hero banners",
    context: "Banner shown at the top of /gifting",
    fallback: images.hero.gifting,
  },
  {
    key: "hero.cravings",
    label: "Indulgence Club hero",
    group: "Hero banners",
    context: "Banner shown at the top of /cravings AND /pastries",
    fallback: images.hero.cravings,
  },
  {
    key: "hero.about",
    label: "About hero",
    group: "Hero banners",
    context: "Banner shown at the top of /about",
    fallback: images.hero.about,
  },
  {
    key: "hero.contact",
    label: "Contact hero",
    group: "Hero banners",
    context: "Banner shown at the top of /contact",
    fallback: images.hero.contact,
  },
  {
    key: "hero.journal",
    label: "Journal hero",
    group: "Hero banners",
    context: "Banner shown at the top of /journal",
    fallback: images.hero.journal,
  },
  {
    key: "hero.faq",
    label: "FAQ hero",
    group: "Hero banners",
    context: "Banner shown at the top of /faq",
    fallback: images.hero.faq,
  },
  {
    key: "hero.privacy",
    label: "Privacy policy hero",
    group: "Hero banners",
    context: "Banner shown at the top of /privacy",
    fallback: images.hero.privacy,
  },
  {
    key: "hero.terms",
    label: "Terms hero",
    group: "Hero banners",
    context: "Banner shown at the top of /terms",
    fallback: images.hero.terms,
  },
  {
    key: "hero.cookies",
    label: "Cookies policy hero",
    group: "Hero banners",
    context: "Banner shown at the top of /cookies",
    fallback: images.hero.cookies,
  },

  // ============================================================
  // Home page service cards — the four big tiles under "Four
  // services, one standard".
  // ============================================================
  {
    key: "services.catering",
    label: "Catering card (home)",
    group: "Service cards",
    context: "Card on the home page that links to /catering",
    fallback: images.services.catering,
  },
  {
    key: "services.events",
    label: "Event planning card (home)",
    group: "Service cards",
    context: "Card on the home page that links to /events",
    fallback: images.services.events,
  },
  {
    key: "services.gifting",
    label: "Gifting card (home)",
    group: "Service cards",
    context: "Card on the home page that links to /gifting",
    fallback: images.services.gifting,
  },
  {
    key: "services.content",
    label: "Content creation card (home)",
    group: "Service cards",
    context: "Card on the home page that links to /content-creation",
    fallback: images.services.content,
  },

  // ============================================================
  // Home-page Indulgence Club teaser tile. Renders inside the
  // "Plan your indulgence." promo strip on `/`. Kept under its
  // own key (rather than reusing `hero.cravings`) so the operator
  // can choose a different photograph for the home teaser vs. the
  // full-bleed hero on `/cravings`.
  // ============================================================
  {
    key: "home.indulgence-teaser",
    label: "Indulgence Club teaser (home)",
    group: "Service cards",
    context: "Tile on the home page promo strip linking to /cravings",
    fallback: images.cravings.teaser,
    defaultAlt: "A curated pastry box from The Nimi Indulgence Club",
  },

  // ============================================================
  // Catering tier cards — buffet, family-style, plated.
  // ============================================================
  {
    key: "catering.buffet",
    label: "Buffet service",
    group: "Catering tiers",
    context: "Tier card on /catering",
    fallback: images.catering.buffet,
  },
  {
    key: "catering.familyStyle",
    label: "Family-style service",
    group: "Catering tiers",
    context: "Tier card on /catering",
    fallback: images.catering.familyStyle,
  },
  {
    key: "catering.plated",
    label: "Plated service",
    group: "Catering tiers",
    context: "Tier card on /catering",
    fallback: images.catering.plated,
  },

  // ============================================================
  // Event planning tier cards — coordination, design, production.
  // ============================================================
  {
    key: "events.coordination",
    label: "Coordination tier",
    group: "Event planning tiers",
    context: "Tier card on /events",
    fallback: images.events.coordination,
  },
  {
    key: "events.design",
    label: "Design + coordination tier",
    group: "Event planning tiers",
    context: "Tier card on /events",
    fallback: images.events.design,
  },
  {
    key: "events.production",
    label: "Full production tier",
    group: "Event planning tiers",
    context: "Tier card on /events",
    fallback: images.events.production,
  },

  // ============================================================
  // Gifting collection placeholder photography. These act as
  // fallbacks when a `GiftCollection` row in the DB has no
  // `imageUrl` set. The admin can also edit the collection itself
  // via the new gift-collections editor — these overrides are for
  // the placeholders only.
  // ============================================================
  {
    key: "gifting.essential",
    label: "Essential collection placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'essential-collection' row has no image",
    fallback: images.gifting.essential,
  },
  {
    key: "gifting.signature",
    label: "Signature collection placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'signature-collection' row has no image",
    fallback: images.gifting.signature,
  },
  {
    key: "gifting.executive",
    label: "Executive series placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'executive-series' row has no image",
    fallback: images.gifting.executive,
  },
  {
    key: "gifting.heritage",
    label: "Heritage collection placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'heritage-collection' row has no image",
    fallback: images.gifting.heritage,
  },
  {
    key: "gifting.softLuxe",
    label: "Soft luxe box placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'soft-luxe-box' row has no image",
    fallback: images.gifting.softLuxe,
  },
  {
    key: "gifting.classicKeepsake",
    label: "Classic keepsake placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'classic-keepsake' row has no image",
    fallback: images.gifting.classicKeepsake,
  },
  {
    key: "gifting.luxe",
    label: "Luxe collection placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'luxe-collection' row has no image",
    fallback: images.gifting.luxe,
  },
  {
    key: "gifting.celebration",
    label: "Celebration box placeholder",
    group: "Gift collection placeholders",
    context: "Used when the 'celebration-box' row has no image",
    fallback: images.gifting.celebration,
  },
];

/**
 * Shape returned by `GET /v1/site-images`. Mirrors the public
 * controller's DTO on the API.
 */
interface SiteImageRow {
  key: string;
  url: string;
  alt: string | null;
}

/**
 * Fetch every admin override in one round trip. Cached for 60
 * seconds — the marketing site re-renders frequently and the
 * override table changes rarely (an admin edits this once, not
 * once per request).
 *
 * Returns an empty map on any error — we fail-open so a transient
 * API issue can't take the public site down. Hardcoded fallbacks
 * still resolve correctly.
 */
let cachedOverrides: Map<string, SiteImageRow> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadOverrides(): Promise<Map<string, SiteImageRow>> {
  const now = Date.now();
  if (cachedOverrides && now - cachedAt < CACHE_TTL_MS) {
    return cachedOverrides;
  }
  try {
    const rows = await apiFetch<SiteImageRow[]>("/site-images", {
      method: "GET",
      cache: "no-store",
    });
    cachedOverrides = new Map(rows.map((r) => [r.key, r]));
    cachedAt = now;
    return cachedOverrides;
  } catch {
    // Transient failure → fall back to whatever we already had,
    // or an empty map. Public site keeps rendering from code-level
    // defaults; this is by design.
    return cachedOverrides ?? new Map();
  }
}

/**
 * Resolve a single image slot. Returns the override URL if set,
 * otherwise the code-level fallback.
 *
 * Usage in a server component:
 *   const heroUrl = await siteImage("hero.home");
 *
 * If the key is missing from the registry, throws in development
 * (so typos surface fast) and falls back to a maroon gradient in
 * production (so the site never breaks because of a string typo).
 */
export async function siteImage(key: string): Promise<string> {
  const entry = SITE_IMAGE_REGISTRY.find((r) => r.key === key);
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `siteImage("${key}") is not in SITE_IMAGE_REGISTRY. Add it to nimi-web/src/lib/siteImages.ts.`,
      );
    }
    return "";
  }
  const overrides = await loadOverrides();
  const override = overrides.get(key);
  return override?.url ?? entry.fallback;
}

/**
 * Same as `siteImage` but returns the resolved alt text. Falls
 * through: admin-set alt → defaultAlt in the registry → label.
 */
export async function siteImageAlt(key: string): Promise<string> {
  const entry = SITE_IMAGE_REGISTRY.find((r) => r.key === key);
  if (!entry) return "";
  const overrides = await loadOverrides();
  const override = overrides.get(key);
  return override?.alt ?? entry.defaultAlt ?? entry.label;
}

/**
 * Returns ONLY the admin-set override for a slot, or null if none
 * is configured.
 *
 * Use this when the caller needs to distinguish "operator uploaded
 * a custom image" from "we're showing the code-level default".
 * Example: the home page swaps to a static `<Hero>` when an
 * override exists, otherwise it uses the looping `<VideoHero>`.
 * Plain `siteImage()` can't tell that apart because it transparently
 * returns the fallback when no override is set.
 */
export async function siteImageOverride(key: string): Promise<string | null> {
  const overrides = await loadOverrides();
  const row = overrides.get(key);
  return row?.url ?? null;
}

/**
 * Bulk variant — when a page renders multiple slots, fetching once
 * here is cheaper than calling `siteImage` repeatedly (which each
 * trigger their own cached lookup but still re-walk the registry).
 *
 * Returns a record keyed by the input keys; missing keys resolve
 * to their registry fallback. Useful for the home page which
 * shows 5+ images.
 */
export async function siteImages(
  ...keys: string[]
): Promise<Record<string, string>> {
  const overrides = await loadOverrides();
  const out: Record<string, string> = {};
  for (const key of keys) {
    const entry = SITE_IMAGE_REGISTRY.find((r) => r.key === key);
    const override = overrides.get(key);
    out[key] = override?.url ?? entry?.fallback ?? "";
  }
  return out;
}
