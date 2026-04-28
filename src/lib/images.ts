/**
 * Image library — semantic image slots used across the marketing surface.
 *
 * STATUS: stand-in photography from Unsplash, free for commercial use.
 * REPLACE BEFORE LAUNCH with brand-shot photography hosted on R2.
 *
 * To swap a single slot:
 *   1. Upload the brand photo to R2 at a stable path (e.g. /marketing/hero/home.jpg).
 *   2. Replace the URL value below with the R2 public URL.
 *   3. Confirm the image renders by visiting the page.
 *
 * Unsplash transformation params:
 *   - `w`  — output width (the CDN delivers at this size)
 *   - `q`  — quality 0–100 (70 is a good default; raise for hero photography)
 *   - `auto=format` — picks AVIF/WebP/JPEG based on browser support
 *   - `fit=crop` — crops to the requested aspect ratio
 */

const unsplash = (
  id: string,
  opts: { w?: number; h?: number; q?: number } = {},
): string => {
  const params = new URLSearchParams();
  params.set("w", String(opts.w ?? 1200));
  if (opts.h) params.set("h", String(opts.h));
  params.set("q", String(opts.q ?? 75));
  params.set("auto", "format");
  params.set("fit", "crop");
  return `https://images.unsplash.com/photo-${id}?${params.toString()}`;
};

/**
 * Image catalog. Grouped by area so swapping a section's photography is
 * a localised change.
 */
export const images = {
  /** Full-bleed hero photography. Sized large for retina displays. */
  hero: {
    home: unsplash("1414235077428-338989a2e8c0", { w: 2000, q: 80 }),
    catering: unsplash("1555939594-58d7cb561ad1", { w: 1800, q: 80 }),
    events: unsplash("1519225421980-715cb0215aed", { w: 1800, q: 80 }),
    gifting: unsplash("1513885535751-8b9238bd345a", { w: 1800, q: 80 }),
    cravings: unsplash("1486427944299-d1955d23e34d", { w: 1800, q: 80 }),
    about: unsplash("1556909114-f6e7ad7d3136", { w: 1800, q: 80 }),
    contact: unsplash("1414235077428-338989a2e8c0", { w: 1800, q: 80 }),
    faq: unsplash("1504754524776-8f4f37790ca0", { w: 1800, q: 80 }),
    journal: unsplash("1495147466023-ac5c588e2e94", { w: 1800, q: 80 }),
    privacy: unsplash("1556910103-1c02745aae4d", { w: 1800, q: 80 }),
    terms: unsplash("1556910103-1c02745aae4d", { w: 1800, q: 80 }),
    cookies: unsplash("1556910103-1c02745aae4d", { w: 1800, q: 80 }),
  },

  /** Three service cards on the homepage. 4:3 aspect ratio. */
  services: {
    catering: unsplash("1414235077428-338989a2e8c0", { w: 1000, h: 750 }),
    events: unsplash("1519225421980-715cb0215aed", { w: 1000, h: 750 }),
    gifting: unsplash("1513885535751-8b9238bd345a", { w: 1000, h: 750 }),
  },

  /** Catering tier cards. */
  catering: {
    basic: unsplash("1546069901-ba9599a7e63c", { w: 1000, h: 750 }),
    premium: unsplash("1414235077428-338989a2e8c0", { w: 1000, h: 750 }),
    platinum: unsplash("1504674900247-0877df9cc836", { w: 1000, h: 750 }),
  },

  /** Event-planning tier cards. */
  events: {
    basic: unsplash("1519225421980-715cb0215aed", { w: 1000, h: 750 }),
    premium: unsplash("1464366400600-7168b8af9bc3", { w: 1000, h: 750 }),
    platinum: unsplash("1532712938310-34cb3982ef74", { w: 1000, h: 750 }),
  },

  /** Gift collection placeholder photography (used when a collection has no imageUrl). */
  gifting: {
    essential: unsplash("1513885535751-8b9238bd345a", { w: 1000, h: 750 }),
    signature: unsplash("1607082348824-0a96f2a4b9da", { w: 1000, h: 750 }),
    executive: unsplash("1606293459339-f5ec7d44f1b1", { w: 1000, h: 750 }),
    heritage: unsplash("1519225421980-715cb0215aed", { w: 1000, h: 750 }),
    softLuxe: unsplash("1556910103-1c02745aae4d", { w: 1000, h: 750 }),
    classicKeepsake: unsplash("1513885535751-8b9238bd345a", { w: 1000, h: 750 }),
    luxe: unsplash("1607082348824-0a96f2a4b9da", { w: 1000, h: 750 }),
    celebration: unsplash("1513885535751-8b9238bd345a", { w: 1000, h: 750 }),
  },

  /** Pastry Cravings — pastry photography for the plan cards. */
  cravings: {
    small: unsplash("1486427944299-d1955d23e34d", { w: 1000, h: 750 }),
    medium: unsplash("1509440159596-0249088772ff", { w: 1000, h: 750 }),
    large: unsplash("1558301211-0d8c8ddee6ec", { w: 1000, h: 750 }),
    teaser: unsplash("1486427944299-d1955d23e34d", { w: 1200, h: 960 }),
  },

  /** About-page founder portrait area. */
  about: {
    founder: unsplash("1556909114-f6e7ad7d3136", { w: 900, h: 1200 }),
  },

  /** Default journal cover when a post hasn't set one. */
  journal: {
    defaultCover: unsplash("1495147466023-ac5c588e2e94", { w: 1200, h: 750 }),
  },
} as const;

/**
 * Helper to build a CSS `background-image` value for a hero or media tile.
 * Always pair with a fallback gradient so a 404 image doesn't show as white.
 */
export const heroBackground = (url: string): React.CSSProperties => ({
  backgroundImage: `url("${url}")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
});
