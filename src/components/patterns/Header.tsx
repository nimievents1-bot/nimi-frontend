import Link from "next/link";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { Stamp } from "@/components/primitives/Stamp";
import { cn } from "@/lib/cn";

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
  { label: "Cravings", href: "/cravings" },
  { label: "Journal", href: "/journal" },
  { label: "FAQ", href: "/faq" },
] as const;

/**
 * Site-wide header — wordmark left, letter-spaced uppercase nav middle,
 * persistent italic-serif "Get in Touch" stamp on the right.
 *
 * Responsive behaviour:
 *   - Below md (768px): nav and stamp hide; a hamburger trigger replaces them
 *     and opens a full-width slide-down drawer (`MobileMenu`).
 *   - md and up: full editorial nav with the stamp pinned right.
 *
 * Two surface variants:
 *   - default: cream background, maroon text  (most pages)
 *   - onDark:  transparent over dark hero, cream nav, cream stamp
 */
export function Header({ onDark = false, current = "" }: HeaderProps) {
  const linkBase =
    "font-sans text-[0.8125rem] font-medium uppercase tracking-[0.26em] py-2.5 transition-colors duration-fast ease-brand border-b border-transparent";
  const linkColour = onDark
    ? "text-cream-50 hover:text-orange-300"
    : "text-neutral-800 hover:text-orange-600";
  const activeBorder = onDark ? "border-cream-50" : "border-maroon-600";

  return (
    <header
      className={cn(
        "grid items-center gap-4 px-page-gutter py-4 md:gap-8 md:py-5",
        // Mobile: wordmark left, hamburger right (two columns).
        // Desktop: wordmark / nav / stamp (three columns).
        "grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_auto]",
        onDark ? "" : "border-b border-cream-200 bg-cream-50",
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

      {/* Desktop stamp — hidden below md so we don't compete with the hamburger. */}
      <div className="hidden md:block">
        <Stamp onDark={onDark} />
      </div>

      {/* Mobile-only menu trigger and drawer. */}
      <div className="md:hidden">
        <MobileMenu items={navItems} onDark={onDark} />
      </div>
    </header>
  );
}
