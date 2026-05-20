/**
 * Single source of truth for the brand's social-media presence.
 *
 * Surfaces that consume this:
 *   - Site footer ("Follow us" column).
 *   - Contact page ("Or find us" block).
 *   - About page ("Stay close" block).
 *   - Transactional email shell (footer band).
 *   - Root metadata (`twitter`, `openGraph`).
 *
 * Keeping the URLs/handles here means a future rename or platform add
 * is a one-file change. Order in the array is the order the icons
 * render — Instagram first because it's the primary channel.
 */

export interface SocialAccount {
  /** Platform name as it'd be spoken aloud — used for aria-labels. */
  name: "Instagram" | "TikTok";
  /** Public URL the icon links to. Must be https. */
  href: string;
  /** Display handle (with the @) — rendered as the visible label
   *  when the surface has room for text. */
  handle: string;
}

export const socialAccounts: ReadonlyArray<SocialAccount> = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/nimi_events",
    handle: "@nimi_events",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@nimi.events",
    handle: "@nimi.events",
  },
];
