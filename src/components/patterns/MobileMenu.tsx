"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useState } from "react";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { Stamp } from "@/components/primitives/Stamp";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  href: string;
}

interface Props {
  items: ReadonlyArray<NavItem>;
  /** Render the trigger in light tone (over dark hero photography). */
  onDark?: boolean;
  /**
   * Render the brand "Get in Touch" stamp at the bottom of the drawer.
   * Default true (marketing). Set false for admin / account layouts.
   */
  showStamp?: boolean;
  /** Optional footer slot rendered below items (e.g. logout, user info). */
  footer?: ReactNode;
}

/**
 * Mobile menu — hamburger trigger plus a slide-down drawer.
 *
 * Behaviour:
 *   - Visible only below the `md` breakpoint (768px) by default. The admin
 *     layout shows it up to `lg`, controlled by the parent's responsive
 *     visibility classes — this component itself is breakpoint-agnostic.
 *   - Trap-free; closes on Escape, on overlay click, and on route change.
 *   - Hides body scroll while open.
 *
 * Styling intentionally matches the brand idiom: cream surface, italic-serif
 * stamp at the bottom (when enabled), generous tap targets for mobile.
 */
export function MobileMenu({
  items,
  onDark = false,
  showStamp = true,
  footer,
}: Props) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center",
          "border border-transparent transition-colors duration-fast",
          onDark
            ? "text-cream-50 hover:border-cream-200/30"
            : "text-maroon-700 hover:border-maroon-200/40",
        )}
      >
        {/* Two-line hamburger that morphs into a close icon. */}
        <svg
          aria-hidden
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <line
            x1="3"
            y1={open ? "11" : "7"}
            x2="19"
            y2={open ? "11" : "7"}
            transform={open ? "rotate(45 11 11)" : undefined}
            style={{ transition: "transform 220ms cubic-bezier(.2,.7,.3,1)" }}
          />
          <line
            x1="3"
            y1={open ? "11" : "15"}
            x2="19"
            y2={open ? "11" : "15"}
            transform={open ? "rotate(-45 11 11)" : undefined}
            style={{ transition: "transform 220ms cubic-bezier(.2,.7,.3,1)" }}
          />
        </svg>
      </button>

      {/* Overlay + drawer. Only rendered when open so unused DOM stays light. */}
      {open ? (
        <div
          className="fixed inset-0 z-[60]"
          aria-modal="true"
          role="dialog"
          aria-label="Site menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-maroon-900/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id={drawerId}
            className={cn(
              "absolute inset-x-0 top-0 max-h-screen overflow-y-auto bg-cream-50",
              "border-b border-cream-200 shadow-md",
              "px-page-gutter pb-8 pt-4",
            )}
          >
            {/* Drawer header — wordmark for orientation + an explicit close button.
                The hamburger trigger is covered by the drawer once open, so this
                close affordance is the primary way out (alongside Escape and the
                overlay click). */}
            <div className="mb-6 flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center",
                  "border border-transparent text-maroon-700",
                  "transition-colors duration-fast hover:border-maroon-200/40",
                )}
              >
                <svg
                  aria-hidden
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="5" x2="17" y2="17" />
                  <line x1="17" y1="5" x2="5" y2="17" />
                </svg>
              </button>
            </div>

            <ul className="m-0 list-none p-0">
              {items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block border-b border-cream-200 py-4",
                        "font-display text-2xl font-medium",
                        active ? "text-orange-700" : "text-maroon-600 hover:text-orange-700",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {showStamp ? (
              <div className="mt-8">
                <Stamp />
              </div>
            ) : null}

            {footer ? <div className="mt-6">{footer}</div> : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}
