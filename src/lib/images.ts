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

  /** Service cards on the homepage. 4:3 aspect ratio. */
  services: {
    catering: unsplash("1414235077428-338989a2e8c0", { w: 1000, h: 750 }),
    events: unsplash("1519225421980-715cb0215aed", { w: 1000, h: 750 }),
    gifting: unsplash("1513885535751-8b9238bd345a", { w: 1000, h: 750 }),
    content: unsplash("1518780664697-55e3ad937233", { w: 1000, h: 750 }),
  },

  /** Event Content Creation page imagery. */
  content: {
    hero: unsplash("1518780664697-55e3ad937233", { w: 1800, q: 80 }),
    photography: unsplash("1502920917128-1aa500764cbd", { w: 1000, h: 750 }),
    videography: unsplash("1485846234645-a62644f84728", { w: 1000, h: 750 }),
    delivery: unsplash("1496181133206-80ce9b88a853", { w: 1000, h: 750 }),
  },

  /** Catering tier cards: Buffet · Family-style · Plated. */
  catering: {
    buffet: unsplash("1546069901-ba9599a7e63c", { w: 1000, h: 750 }),
    familyStyle: unsplash("1414235077428-338989a2e8c0", { w: 1000, h: 750 }),
    plated: unsplash("1504674900247-0877df9cc836", { w: 1000, h: 750 }),
  },

  /** Event-planning tier cards: Coordination · Design + Coordination · Full production. */
  events: {
    coordination: unsplash("1519225421980-715cb0215aed", { w: 1000, h: 750 }),
    design: unsplash("1464366400600-7168b8af9bc3", { w: 1000, h: 750 }),
    production: unsplash("1532712938310-34cb3982ef74", { w: 1000, h: 750 }),
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

  /** The Indulgence Club — pastry photography for the plan cards. */
  cravings: {
    small: unsplash("1486427944299-d1955d23e34d", { w: 1000, h: 750 }),
    medium: unsplash("1509440159596-0249088772ff", { w: 1000, h: 750 }),
    large: unsplash("1558301211-0d8c8ddee6ec", { w: 1000, h: 750 }),
    teaser: unsplash("1486427944299-d1955d23e34d", { w: 1200, h: 960 }),
  },

  /**
   * Indulgence Club pastry gallery — nine product photographs. These are
   * STAND-IN images chosen to be visually plausible for the named pastry;
   * REPLACE WITH REAL PRODUCT PHOTOGRAPHY before launch by uploading to
   * R2 and swapping the URL. The keys are stable so swapping is a one-line
   * change per item.
   *
   * Aspect ratio 1:1 — the gallery renders as a square grid for editorial
   * uniformity. If a photo is non-square it'll be cover-cropped to the
   * centre.
   */
  pastries: {
    meatPie: unsplash("1626776877281-9a07dd4ff09a", { w: 800, h: 800 }),
    chickenPie: unsplash("1568901346375-23c9450c58cd", { w: 800, h: 800 }),
    eggRoll: unsplash("1599487488170-d11ec9c172f0", { w: 800, h: 800 }),
    fishPie: unsplash("1565958011703-44f9829ba187", { w: 800, h: 800 }),
    puffPuff: unsplash("1551024601-bec78aea704b", { w: 800, h: 800 }),
    zobo: unsplash("1497534446932-c925b458314e", { w: 800, h: 800 }),
    chickenShawarma: unsplash("1561651823-34b9bf67abf6", { w: 800, h: 800 }),
    asunShawarma: unsplash("1529193591184-b1d58069ecdd", { w: 800, h: 800 }),
    comboShawarma: unsplash("1593504049359-74330189a345", { w: 800, h: 800 }),
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
