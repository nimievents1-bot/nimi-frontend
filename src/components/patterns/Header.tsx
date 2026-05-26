import Link from "next/link";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { Stamp } from "@/components/primitives/Stamp";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

import { CartIndicator } from "./CartIndicator";
import { MobileMenu } from "./MobileMenu";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  /** Render in light tone (over dark photography). Default false. */
  onDark?: boolean;
  /** Pathname of the current page, for highlighting active nav. */
  current?: string;
}

// Top-level nav. Order matters — left-to-right is the customer's
// expected discovery path. "Pastries" sits next to "Indulgence" so
// the two food-product surfaces appear together; the subscription
// pitch ("Indulgence") and the one-off shop ("Pastries") read as
// related siblings rather than competing surfaces.
//
// `/journal` still exists as a route (and the Footer keeps a link
// there for now) — the operator chose to push pastries above Journal
// in the primary nav because one-off purchases are a higher-intent
// destination than blog content.
const navItems = [
  { label: "Home", href: "/" },
  { label: "Catering", href: "/catering" },
  { label: "Events", href: "/events" },
  { label: "Gifting", href: "/gifting" },
  { label: "Indulgence", href: "/cravings" },
  { label: "Pastries", href: "/pastries" },
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
 *   - Below lg (1024px): nav and stamp hide; a hamburger trigger replaces
 *     them and opens a full-width slide-down drawer (`MobileMenu`). This
 *     range covers phones AND iPad portrait (820-834px) — the editorial
 *     7-item nav simply doesn't fit alongside the wordmark, sign-in
 *     link, bell, cart, and stamp until you have ~1200px of horizontal
 *     room. The cart and bell icons stay visible on the mobile cluster
 *     at every size — cart is the most frequent marketing action once
 *     items are added.
 *   - lg (1024-1279px): full nav with cart + bell + sign in, no stamp.
 *     Tightened gaps so the 7 items + right cluster fit on iPad
 *     landscape and small laptops without scrunching.
 *   - xl and up (1280px+): the original generous layout — wider gaps
 *     and the italic-serif "Get in Touch" stamp pinned right.
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
        "sticky top-0 z-40 grid items-center gap-4 px-page-gutter py-4 lg:gap-6 lg:py-5 xl:gap-8",
        // Phones + iPad portrait: wordmark left, cart + hamburger right.
        // lg and up: wordmark / nav / right cluster.
        "grid-cols-[1fr_auto] lg:grid-cols-[auto_1fr_auto]",
        surface,
      )}
    >
      <Wordmark withTag onDark={onDark} />

      {/* Desktop nav — hidden below lg so iPad portrait gets the
          hamburger drawer instead of an overflowing 7-item editorial
          nav. Gap tightens on lg, opens up again at xl where the
          stamp also reappears. */}
      <nav
        aria-label="Primary"
        className="hidden justify-center gap-x-5 lg:flex xl:gap-x-10"
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

      {/* Desktop right column: sign in / account, cart icon, Get-in-Touch stamp.
          - Unauthenticated visitors see "Sign in" — italic-serif voice so it
            doesn't compete visually with the primary "Get in Touch" stamp
            but is unmistakably a CTA. Sends them to /login.
          - Signed-in visitors see "Account" instead, pointing at /account.
            Staff (OWNER/EDITOR/SUPPORT) hitting /account get server-side
            redirected to /admin, so this single link works for everyone. */}
      <div className="hidden items-center gap-3 lg:flex xl:gap-5">
        {isAuthed ? (
          <Link
            href="/account"
            className={cn(
              "font-display text-base italic transition-colors duration-fast ease-brand",
              onDark
                ? "text-cream-50 hover:text-orange-300"
                : "text-maroon-700 hover:text-orange-700",
            )}
          >
            Account
          </Link>
        ) : (
          <Link
            href="/login"
            className={cn(
              "font-display text-base italic transition-colors duration-fast ease-brand",
              onDark
                ? "text-cream-50 hover:text-orange-300"
                : "text-maroon-700 hover:text-orange-700",
            )}
          >
            Sign in
          </Link>
        )}
        {/* Bell renders only for signed-in users — the underlying
            /notifications endpoint is JWT-guarded and would 401 for
            anonymous requests anyway. Hiding the bell when there's no
            session keeps the chrome clean and avoids a stray
            "0 unread" badge for visitors who'll never have inbox. */}
        {isAuthed ? <NotificationBell onDark={onDark} /> : null}
        <CartIndicator onDark={onDark} isAuthed={isAuthed} />
        {/* Stamp is generous in width — reserve it for xl+ where the
            nav, right cluster, and stamp all coexist comfortably. On
            lg (iPad landscape, small laptops) we drop the stamp so the
            7-item nav has enough breathing room. */}
        <div className="hidden xl:block">
          <Stamp onDark={onDark} />
        </div>
      </div>

      {/* Mobile + iPad-portrait right cluster: cart icon stays visible,
          hamburger to its right. Sign in / Account is folded into the
          drawer items so the cluster stays compact. Bell appears for
          signed-in users only, sitting between the cart and the
          hamburger. Hidden at lg+ where the full desktop cluster
          above takes over. */}
      <div className="flex items-center gap-2 lg:hidden">
        {isAuthed ? <NotificationBell onDark={onDark} /> : null}
        <CartIndicator onDark={onDark} isAuthed={isAuthed} />
        <MobileMenu
          items={[
            ...navItems,
            { label: "Cart", href: "/cart" },
            isAuthed
              ? { label: "Account", href: "/account" }
              : { label: "Sign in", href: "/login" },
          ]}
          onDark={onDark}
        />
      </div>
    </header>
  );
}
