import Link from "next/link";

import { NimiPotMark, Wordmark } from "@/components/brand/NimiPotMark";
import { CartIndicator } from "@/components/patterns/CartIndicator";
import { Footer } from "@/components/patterns/Footer";
import { MobileMenu } from "@/components/patterns/MobileMenu";
import { NotificationBell } from "@/components/patterns/NotificationBell";
import { requireSessionUser } from "@/lib/auth";

import { LogoutButton } from "./LogoutButton";
import { SidebarLink } from "./SidebarLink";

/**
 * Customer account layout — sidebar-first navigation matching the
 * admin surface so the chrome reads consistently across staff and
 * customer experiences.
 *
 * Why a sidebar (over a top nav):
 *   - The account surface has six top-level sections plus per-record
 *     detail pages. A top nav crowds and wraps below md; a sidebar
 *     gives every link breathing room and pins them in place while
 *     long pages (orders history, subscription dashboard) scroll.
 *   - Visual parity with `/admin/*` reduces the cognitive switching
 *     cost for staff who occasionally pop into the customer view to
 *     reproduce a bug or check a flow.
 *
 * Auth + role gating:
 *   - `requireSessionUser()` redirects to `/login` if no session.
 *   - Staff (OWNER/EDITOR/SUPPORT) are NOT bumped here — the account
 *     pages themselves redirect staff to `/admin`. Keeping the layout
 *     itself open to all signed-in roles means an owner who passes
 *     `?as=customer` can still see the customer view through their
 *     real session without spoofing a role.
 *
 * Responsive behaviour:
 *   - lg+: sticky 240px sidebar with section-grouped nav. Top bar
 *     hosts the notification bell + cart indicator so they're pinned
 *     to the top of the working canvas rather than buried in the
 *     sidebar footer.
 *   - below lg: sidebar collapses; a top header carries the wordmark,
 *     bell, cart, and a hamburger drawer that mirrors the nav.
 *
 * Footer:
 *   - Marketing footer is rendered here too so the customer's
 *     navigation, legal links, social handles, and "powered by"
 *     hygiene strip stay reachable from every account page.
 */

interface NavItem {
  label: string;
  href: string;
  section: "Overview" | "My activity" | "Account";
}

/**
 * Order matters — the array order drives both the desktop sidebar
 * order and the mobile drawer order. Keep "Overview" first, "Account"
 * last, and put the most-used items inside "My activity" in the
 * order customers reach for them.
 */
const ACCOUNT_NAV: readonly NavItem[] = [
  { label: "Dashboard", href: "/account", section: "Overview" },

  { label: "Bookings", href: "/account/bookings", section: "My activity" },
  // "Gifting" and "Pastries" are browse-first surfaces that land on
  // available items with secondary access to history. "Orders" and
  // "Subscription" remain available below for customers who want to
  // go straight to their records instead.
  { label: "Gifting", href: "/account/gifting", section: "My activity" },
  { label: "Pastries", href: "/account/pastries", section: "My activity" },
  { label: "Orders", href: "/account/orders", section: "My activity" },
  { label: "Subscription", href: "/account/subscription", section: "My activity" },

  { label: "Profile", href: "/account/profile", section: "Account" },
  { label: "Security", href: "/account/security", section: "Account" },
];

const SECTION_ORDER = ["Overview", "My activity", "Account"] as const;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  // Group nav items so the section headers render once per section in
  // both the desktop sidebar and (potentially future) drawer with
  // section dividers. Mobile drawer uses the flat list — the MobileMenu
  // component doesn't currently render section headers.
  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: ACCOUNT_NAV.filter((n) => n.section === section),
  }));

  return (
    <div className="min-h-screen bg-cream-50 lg:grid lg:grid-cols-[240px_1fr]">
      {/* ----------------------------------------------------------------
        Mobile / tablet header (below lg).
        Wordmark on the left so the customer always knows where they
        are. Bell + cart + hamburger on the right. The cart belongs
        here rather than inside the drawer because it's the highest-
        intent action on the surface — adding items shouldn't require
        two taps.
      ---------------------------------------------------------------- */}
      <header className="flex items-center justify-between border-b border-cream-200 bg-cream-50 px-page-gutter py-4 lg:hidden">
        <Link href="/account" className="no-underline" aria-label="Nimi Events account home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <CartIndicator isAuthed />
          <MobileMenu
            items={ACCOUNT_NAV}
            showStamp={false}
            footer={
              <div className="border-t border-cream-200 pt-6">
                <p className="m-0 mb-1 font-sans text-sm font-medium text-maroon-700">
                  {user.name}
                </p>
                <p className="m-0 mb-4 font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {user.email}
                </p>
                <LogoutButton />
              </div>
            }
          />
        </div>
      </header>

      {/* ----------------------------------------------------------------
        Desktop sidebar (lg+). Sticky so it stays in view as the
        content column scrolls. Section-grouped nav matches the admin
        surface for visual consistency.
      ---------------------------------------------------------------- */}
      <aside
        aria-label="Account navigation"
        className="hidden border-r border-cream-200 bg-cream-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
      >
        <Link href="/account" className="flex items-center gap-3 px-6 py-6 no-underline">
          <NimiPotMark className="h-9 w-9 flex-none" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-medium uppercase tracking-[0.16em] text-maroon-600">
              Nimi Events
            </span>
            <span className="mt-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-neutral-500">
              My account
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          {grouped.map(({ section, items }) =>
            items.length > 0 ? (
              <div key={section} className="mb-6">
                <p className="m-0 mb-2 px-2 font-sans text-2xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  {section}
                </p>
                <ul className="m-0 list-none space-y-0.5 p-0">
                  {items.map((item) => (
                    <li key={item.href}>
                      {/*
                        `exact` only for the Dashboard link — every
                        other section is allowed to match deeper
                        sub-routes (e.g. `Orders` stays active on
                        `/account/orders/gift/NIMI-…`).
                      */}
                      <SidebarLink
                        href={item.href}
                        label={item.label}
                        exact={item.href === "/account"}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </nav>

        {/*
          Sidebar footer — identity + sign out only. Bell and cart are
          hoisted to the top bar of the content area so they're
          reachable while reading any page rather than buried at the
          bottom of the chrome.
        */}
        <div className="border-t border-cream-200 px-6 py-5">
          <p className="m-0 truncate font-sans text-sm font-medium text-maroon-700">
            {user.name}
          </p>
          <p className="m-0 mb-3 truncate font-sans text-2xs font-medium uppercase tracking-[0.18em] text-neutral-500">
            {user.email}
          </p>
          <LogoutButton />
        </div>
      </aside>

      {/* ----------------------------------------------------------------
        Content column.

        On desktop (lg+) we paint a sticky top bar above the page that
        hosts the notification bell + cart indicator. The bar is
        intentionally minimal — just right-aligned utility actions —
        so the sidebar carries the navigation weight and the page
        body holds the customer's full attention.

        On mobile the header above already includes bell + cart, so
        this bar is hidden below lg.
      ---------------------------------------------------------------- */}
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-30 hidden items-center justify-end gap-3 border-b border-cream-200 bg-cream-50/95 px-page-gutter py-3 backdrop-blur supports-[backdrop-filter]:bg-cream-50/80 lg:flex">
          <NotificationBell />
          <CartIndicator isAuthed />
        </div>

        <main className="flex-1 px-page-gutter py-10 md:py-12 lg:py-10">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>

        {/*
          Marketing footer keeps legal, social, and hygiene-strip
          reachable from every account page — exactly as it does on
          the public-facing routes. Sits below the main content so it
          scrolls with the page, not pinned.
        */}
        <Footer />
      </div>
    </div>
  );
}
