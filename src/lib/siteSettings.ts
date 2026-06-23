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
  // Pastry orders — business rules.
  // ============================================================
  {
    key: "pastry.order.minimum-pence",
    label: "Minimum order amount (in pence)",
    group: "Pastry orders",
    context:
      "Enter the minimum as a whole number of pence — NOT pounds. Examples: 100 = £1.00 · 500 = £5.00 · 2500 = £25.00. Do NOT include £ or a decimal point. Takes effect within 5 minutes.",
    fallback: "2500",
  },

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

  // ============================================================
  // Home page — "Plan your indulgence." promo strip.
  //
  // The whole tile is editable: eyebrow chip, headline, body
  // paragraph, CTA label, and the small "minimum / credits" tag.
  // The image is registered as `home.indulgence-teaser` in
  // SITE_IMAGE_REGISTRY (see siteImages.ts) so the operator can
  // change the photograph from /admin/images.
  // ============================================================
  {
    key: "home.indulgence.eyebrow",
    label: "Indulgence promo — eyebrow",
    group: "Home page",
    context: "The orange capsmall chip above the headline (e.g. \"The Nimi Indulgence Club\")",
    fallback: "The Nimi Indulgence Club",
  },
  {
    key: "home.indulgence.heading",
    label: "Indulgence promo — headline",
    group: "Home page",
    context: "The big maroon serif line (e.g. \"Plan your indulgence.\")",
    fallback: "Plan your indulgence.",
  },
  {
    key: "home.indulgence.body",
    label: "Indulgence promo — body",
    group: "Home page",
    context: "The paragraph under the headline on the home promo strip",
    fallback:
      "Set aside a monthly indulgence allowance that turns into curated pastries, made fresh by Nimi Events. Priority access, exclusive drops, and the occasional surprise — instead of last-minute spending.",
    multiline: true,
  },
  {
    key: "home.indulgence.cta",
    label: "Indulgence promo — button label",
    group: "Home page",
    context: "The CTA button text (e.g. \"Join the club\")",
    fallback: "Join the club",
  },
  {
    key: "home.indulgence.tag",
    label: "Indulgence promo — tag",
    group: "Home page",
    context: "The small orange pill next to the button (e.g. \"3-month minimum · Credits valid 3 months\")",
    fallback: "3-month minimum · Credits valid 3 months",
  },

  // ============================================================
  // About page — hero + story section.
  //
  // Body uses a single multiline field; the page splits on
  // blank-line boundaries and renders each chunk as its own
  // <p>. That lets the operator add or remove paragraphs
  // without us hardcoding a fixed number of slots.
  // ============================================================
  {
    key: "about.hero.eyebrow",
    label: "About hero — eyebrow",
    group: "About page",
    context: "The small caps chip on the /about hero (e.g. \"About\")",
    fallback: "About",
  },
  {
    key: "about.hero.title",
    label: "About hero — title",
    group: "About page",
    context: "The main hero headline on /about",
    fallback: "A family kitchen, scaled with care.",
  },
  {
    key: "about.hero.lede",
    label: "About hero — lede",
    group: "About page",
    context: "The subhead under the hero title on /about",
    fallback: "Born from a stovetop, run like a hotel.",
    multiline: true,
  },
  {
    key: "about.story.eyebrow",
    label: "About story — eyebrow",
    group: "About page",
    context: "The capsmall chip above the story heading (e.g. \"The story\")",
    fallback: "The story",
  },
  {
    key: "about.story.heading",
    label: "About story — heading",
    group: "About page",
    context: "The maroon serif headline above the story body",
    fallback: "Cooking has always been our way of holding people.",
  },
  {
    key: "about.story.body",
    label: "About story — body",
    group: "About page",
    context:
      "The story copy under the heading. Separate paragraphs with a blank line; each chunk renders as its own paragraph.",
    fallback:
      "Nimi began at a family table, in a kitchen that always seemed to expand to fit one more chair. The smell of jollof simmering on a Sunday afternoon, the laughter that followed plates being passed around — that's where this story starts. Authentically African flavours, served the way they were meant to be: with care, with intent, with love.\n\nWhat was a Sunday ritual became a small business, and then a team, and then a calendar of weddings, corporate days and quiet birthdays across the UK. Through every shift, the standard hasn't moved. We cook real food, we serve it with care, and we treat every event like our own.\n\nWhether you're ordering a single gift box or planning a wedding for two hundred guests, you'll get the same answer when you call: what do you need?",
    multiline: true,
  },
  {
    key: "about.social.eyebrow",
    label: "About — social eyebrow",
    group: "About page",
    context: "The small label above the social links at the bottom of /about",
    fallback: "Stay close",
  },

  // ============================================================
  // Content creation page — hero + intro + three format cards
  // + bookings strip. Same pattern as About: every editable
  // string is its own setting, body fields are multiline.
  // ============================================================
  {
    key: "contentCreation.hero.eyebrow",
    label: "Content hero — eyebrow",
    group: "Content creation page",
    context: "The capsmall chip on the /content-creation hero",
    fallback: "Content creation",
  },
  {
    key: "contentCreation.hero.title",
    label: "Content hero — title",
    group: "Content creation page",
    context: "The hero headline on /content-creation",
    fallback: "Event media, captured well.",
  },
  {
    key: "contentCreation.hero.lede",
    label: "Content hero — lede",
    group: "Content creation page",
    context: "The subhead under the hero title on /content-creation",
    fallback:
      "Mobile videography and photography for weddings, brand activations, and milestone celebrations — by the same team that runs your day.",
    multiline: true,
  },
  {
    key: "contentCreation.intro.eyebrow",
    label: "Content intro — eyebrow",
    group: "Content creation page",
    context: "The capsmall chip above the intro paragraph (e.g. \"What we cover\")",
    fallback: "What we cover",
  },
  {
    key: "contentCreation.intro.heading",
    label: "Content intro — heading",
    group: "Content creation page",
    context: "The maroon serif headline above the intro paragraph",
    fallback: "One crew. Two formats. Quietly capturing.",
  },
  {
    key: "contentCreation.intro.body",
    label: "Content intro — body",
    group: "Content creation page",
    context:
      "The intro paragraph under the heading. Separate paragraphs with a blank line.",
    fallback:
      "We work alongside your event team — never in the way of your guests — to capture the room as it is. Photography for the album, mobile-first videography for the feed, delivered fast and finished cleanly. Available stand-alone, or bundled with our catering and event-planning services.",
    multiline: true,
  },
  {
    key: "contentCreation.format.photography.eyebrow",
    label: "Photography card — eyebrow",
    group: "Content creation page",
    context: "The capsmall chip on the Photography format card",
    fallback: "Photography",
  },
  {
    key: "contentCreation.format.photography.title",
    label: "Photography card — title",
    group: "Content creation page",
    context: "The headline on the Photography format card",
    fallback: "Stills that hold the moment.",
  },
  {
    key: "contentCreation.format.photography.description",
    label: "Photography card — description",
    group: "Content creation page",
    context: "The description text on the Photography format card",
    fallback:
      "Editorial-style photography that captures the room, the food, the people, and the small details that make the day feel like yours.",
    multiline: true,
  },
  {
    key: "contentCreation.format.videography.eyebrow",
    label: "Videography card — eyebrow",
    group: "Content creation page",
    context: "The capsmall chip on the Videography format card",
    fallback: "Mobile videography",
  },
  {
    key: "contentCreation.format.videography.title",
    label: "Videography card — title",
    group: "Content creation page",
    context: "The headline on the Videography format card",
    fallback: "Films, made for the feed.",
  },
  {
    key: "contentCreation.format.videography.description",
    label: "Videography card — description",
    group: "Content creation page",
    context: "The description text on the Videography format card",
    fallback:
      "Same-day reels and short films optimised for social — fast turnaround, cinematic feel, ready to share before the night is over.",
    multiline: true,
  },
  {
    key: "contentCreation.format.delivery.eyebrow",
    label: "Delivery card — eyebrow",
    group: "Content creation page",
    context: "The capsmall chip on the Delivery format card",
    fallback: "Delivery",
  },
  {
    key: "contentCreation.format.delivery.title",
    label: "Delivery card — title",
    group: "Content creation page",
    context: "The headline on the Delivery format card",
    fallback: "Quick, considered, branded.",
  },
  {
    key: "contentCreation.format.delivery.description",
    label: "Delivery card — description",
    group: "Content creation page",
    context: "The description text on the Delivery format card",
    fallback:
      "Edited highlight reels within 48 hours. Full galleries within two weeks. Optional brand-tagged versions for corporate clients.",
    multiline: true,
  },
  {
    key: "contentCreation.bookings.eyebrow",
    label: "Bookings strip — eyebrow",
    group: "Content creation page",
    context: "The capsmall chip on the bookings strip at the bottom of /content-creation",
    fallback: "Bookings",
  },
  {
    key: "contentCreation.bookings.title",
    label: "Bookings strip — title",
    group: "Content creation page",
    context: "The headline on the bookings strip (e.g. \"Pricing is custom.\")",
    fallback: "Pricing is custom.",
  },
  {
    key: "contentCreation.bookings.body",
    label: "Bookings strip — body",
    group: "Content creation page",
    context: "The paragraph on the bookings strip",
    fallback:
      "Custom pricing based on event length, deliverables, and crew size. Minimum half-day bookings. Tell us about your event and we'll send a quote within one working day.",
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
