import Link from "next/link";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { Stamp } from "@/components/primitives/Stamp";
import { cn } from "@/lib/cn";

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
        "grid items-center gap-8 px-8 py-5",
        "grid-cols-[auto,1fr,auto]",
        onDark ? "" : "border-b border-cream-200 bg-cream-50",
      )}
    >
      <Wordmark withTag onDark={onDark} />
      <nav aria-label="Primary" className="flex justify-center gap-x-8 lg:gap-x-12">
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
      <Stamp onDark={onDark} />
    </header>
  );
}
