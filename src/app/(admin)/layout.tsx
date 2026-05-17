import Link from "next/link";
import { redirect } from "next/navigation";

import { NimiPotMark, Wordmark } from "@/components/brand/NimiPotMark";
import { MobileMenu } from "@/components/patterns/MobileMenu";
import { NotificationBell } from "@/components/patterns/NotificationBell";
import { getSessionUser } from "@/lib/auth";

import { LogoutButton } from "../(account)/LogoutButton";

const ADMIN_ROLES = new Set(["OWNER", "EDITOR", "SUPPORT"]);

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", section: "Overview" as const },
  { label: "Content", href: "/admin/content", section: "Content" as const },
  { label: "Journal", href: "/admin/blog", section: "Content" as const },
  { label: "Testimonials", href: "/admin/testimonials", section: "Content" as const },
  { label: "Menu", href: "/admin/menu", section: "Catalog" as const },
  { label: "Enquiries", href: "/admin/enquiries", section: "Operations" as const },
  { label: "Gift orders", href: "/admin/orders", section: "Operations" as const },
  { label: "Pastry orders", href: "/admin/pastry-orders", section: "Operations" as const },
  { label: "Indulgence", href: "/admin/cravings", section: "Operations" as const },
  { label: "Audit", href: "/admin/audit", section: "System" as const },
] as const;

const SECTION_ORDER = ["Overview", "Content", "Catalog", "Operations", "System"] as const;

/**
 * Admin layout — gates the entire `/admin/*` namespace by role.
 *
 * Anyone without OWNER/EDITOR/SUPPORT lands here gets redirected to
 * `/login`. The decision is made server-side here and again in the API
 * via @Roles() on every admin endpoint, so even a forged cookie can't
 * read or write content.
 *
 * Visual structure: a sticky left sidebar (240px on lg+) groups nav items
 * by section (Overview / Content / Operations / System) so the founder
 * can scan the surface at a glance. Below lg the sidebar collapses to a
 * hamburger drawer that mirrors the same grouping.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.has(user.role)) {
    redirect("/login?next=/admin");
  }

  // Group nav items so we can render section headers in both the sidebar
  // and the mobile drawer without duplicating the data structure.
  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: ADMIN_NAV.filter((n) => n.section === section),
  }));

  return (
    <div className="min-h-screen bg-cream-50 lg:grid lg:grid-cols-[240px_1fr]">
      {/* Mobile / tablet header (below lg) — wordmark + bell + drawer trigger. */}
      <header className="flex items-center justify-between border-b border-cream-200 bg-cream-50 px-page-gutter py-4 lg:hidden">
        <Wordmark />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <MobileMenu
            items={ADMIN_NAV}
            showStamp={false}
            footer={
              <div className="border-t border-cream-200 pt-6">
                <p className="m-0 mb-1 font-sans text-sm text-maroon-700">{user.name}</p>
                <p className="m-0 mb-4 font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {user.role.toLowerCase()}
                </p>
                <LogoutButton />
              </div>
            }
          />
        </div>
      </header>

      {/* Desktop sidebar (lg+). Sticky so it stays in view as content scrolls. */}
      <aside
        aria-label="Admin navigation"
        className="hidden border-r border-cream-200 bg-cream-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
      >
        <Link href="/admin" className="flex items-center gap-3 px-6 py-6 no-underline">
          <NimiPotMark className="h-9 w-9 flex-none" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-medium uppercase tracking-[0.16em] text-maroon-600">
              Nimi Events
            </span>
            <span className="mt-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-neutral-500">
              Admin
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
                      <Link
                        href={item.href}
                        className="block px-3 py-2 font-sans text-sm font-medium text-neutral-800 transition-colors duration-fast ease-brand hover:bg-cream-50 hover:text-orange-700"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </nav>

        <div className="border-t border-cream-200 px-6 py-5">
          {/* Bell + identity row. The bell anchors top-right so the
              dropdown opens leftward into the sidebar's content area
              rather than off the screen. */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 truncate font-sans text-sm font-medium text-maroon-700">
                {user.name}
              </p>
              <p className="m-0 font-sans text-2xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {user.role.toLowerCase()}
              </p>
            </div>
            <NotificationBell />
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="px-page-gutter py-10 md:py-12 lg:py-10">
        <div className="mx-auto w-full max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
