import Link from "next/link";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { Stamp } from "@/components/primitives/Stamp";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

import { CartIndicator } from "./CartIndicator";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  /** Render in light tone (over dark photography). Default false. */
  onDark?: boolean;
  /** Pathname of the current page, for highlighting active nav. */
  current?: string;
}

const navItems = [
  { label: "Home", href: "/" },
  { label: "Catering", href: "/catering" },
  { label: "Events", href: "/events" },
  { label: "Gifting", href: "/gifting" },
  { label: "Indulgence", href: "/cravings" },
  { label: "Journal", href: "/journal" },
  { label: "FAQ", href: "/faq" },
] as const;

/**
 * Site-wide header — wordmark left, letter-spaced uppercase nav middle,
 * cart icon + persistent italic-serif "Get in Touch" stamp on the right.
 *
 * Sticky behaviour:
 *   - The header stays fixed at the top of the viewport on every page.
 *   - On light pages (default) the cream surface follows the user down
 *     with a soft backdrop blur — perfectly readable over any content.
 *   - On the dark hero variant (homepage) the surface is a translucent
 *     maroon-tinted glass, so the chrome remains legible whether the
 *     user is still over the hero photograph or has scrolled into the
 *     cream content below. This deliberately trades the original
 *     fully-transparent look for cross-section readability.
 *
 * Responsive behaviour:
 *   - Below md (768px): nav and stamp hide; a hamburger trigger replaces
 *     them and opens a full-width slide-down drawer (`MobileMenu`).
 *     The cart icon is left visible at all sizes — it's the most
 *     frequent action on the marketing surface once items are added.
 *   - md and up: full editorial nav with the cart icon, stamp pinned right.
 *
 * Server component: reads the session so it can tell the cart indicator
 * whether the user is authed (anonymous users get an icon that links to
 * /login?next=/cart instead of poking the protected endpoint).
 */
export async function Header({ onDark = false, current = "" }: HeaderProps) {
  const user = await getSessionUser();
  const isAuthed = Boolean(user);

  const linkBase =
    "font-sans text-[0.8125rem] font-medium uppercase tracking-[0.26em] py-2.5 transition-colors duration-fast ease-brand border-b border-transparent";
  const linkColour = onDark
    ? "text-cream-50 hover:text-orange-300"
    : "text-neutral-800 hover:text-orange-600";
  const activeBorder = onDark ? "border-cream-50" : "border-maroon-600";

  // Sticky surface tokens. The slight transparency + backdrop-blur keeps
  // the chrome from feeling like a heavy bar — closer to a frosted-glass
  // strip over the editorial layout below.
  const surface = onDark
    ? "bg-maroon-900/55 backdrop-blur supports-[backdrop-filter]:bg-maroon-900/40"
    : "border-b border-cream-200 bg-cream-50/90 backdrop-blur supports-[backdrop-filter]:bg-cream-50/75";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 grid items-center gap-4 px-page-gutter py-4 md:gap-8 md:py-5",
        // Mobile: wordmark left, cart + hamburger right.
        // Desktop: wordmark / nav / cart + stamp.
        "grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_auto]",
        surface,
      )}
    >
      <Wordmark withTag onDark={onDark} />

      {/* Desktop nav — hidden below md. */}
      <nav
        aria-label="Primary"
        className="hidden justify-center gap-x-8 md:flex lg:gap-x-12"
      >
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? current === "/"
              : current === item.href || current.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(linkBase, linkColour, active && activeBorder)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop right column: cart icon + Get-in-Touch stamp. */}
      <div className="hidden items-center gap-4 md:flex">
        <CartIndicator onDark={onDark} isAuthed={isAuthed} />
        <Stamp onDark={onDark} />
      </div>

      {/* Mobile-only right cluster: cart icon stays visible, hamburger to its right. */}
      <div className="flex items-center gap-2 md:hidden">
        <CartIndicator onDark={onDark} isAuthed={isAuthed} />
        <MobileMenu items={[...navItems, { label: "Cart", href: "/cart" }]} onDark={onDark} />
      </div>
    </header>
  );
}
