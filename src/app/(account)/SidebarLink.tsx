"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

interface SidebarLinkProps {
  href: string;
  label: string;
  /**
   * When true (the default for `/account`), the link is active ONLY on
   * an exact path match. Without this guard, every sub-route under
   * `/account` (`/account/orders`, `/account/profile`, …) would also
   * activate the Dashboard link, lighting up two items at once.
   */
  exact?: boolean;
}

/**
 * Sidebar nav link that highlights itself when the current pathname
 * matches its `href`. Carved out as a tiny client component so the
 * (account) layout itself can stay a server component — the only
 * thing that needs the client runtime here is `usePathname`.
 *
 * Visual states:
 *   - inactive: neutral text, subtle hover bg
 *   - active: maroon text, cream-50 background, left orange accent
 *     bar (matches the admin nav active state we paint on the same
 *     surface)
 */
export function SidebarLink({ href, label, exact = false }: SidebarLinkProps) {
  const pathname = usePathname() ?? "";
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative block rounded-sm px-3 py-2 font-sans text-sm font-medium transition-colors duration-fast ease-brand",
        active
          ? "bg-cream-50 text-maroon-700"
          : "text-neutral-800 hover:bg-cream-50 hover:text-orange-700",
      )}
    >
      {/*
        Left accent bar on active state — pinned to the left edge of
        the link so the active row reads from the eye even when the
        sidebar is glanced at peripherally.
      */}
      {active ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-orange-500"
        />
      ) : null}
      {label}
    </Link>
  );
}
