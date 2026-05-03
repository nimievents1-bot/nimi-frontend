import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { MobileMenu } from "@/components/patterns/MobileMenu";
import { getSessionUser } from "@/lib/auth";

import { LogoutButton } from "../(account)/LogoutButton";

const ADMIN_ROLES = new Set(["OWNER", "EDITOR", "SUPPORT"]);

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Content", href: "/admin/content" },
  { label: "Enquiries", href: "/admin/enquiries" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Indulgence", href: "/admin/cravings" },
  { label: "Journal", href: "/admin/blog" },
  { label: "Testimonials", href: "/admin/testimonials" },
  { label: "Audit", href: "/admin/audit" },
] as const;

/**
 * Admin layout — gates the entire `/admin/*` namespace by role.
 *
 * Anyone without OWNER/EDITOR/SUPPORT lands here gets redirected to
 * `/login`. The decision is made server-side here and again in the API
 * via @Roles() on every admin endpoint, so even a forged cookie can't
 * read or write content.
 *
 * Responsive: nav and user info collapse to a hamburger drawer below lg
 * (the admin nav has 7 items so it needs more width than the marketing
 * nav before it can fit on one row).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || !ADMIN_ROLES.has(user.role)) {
    redirect("/login?next=/admin");
  }

  return (
    <>
      <header className="border-b border-cream-200 bg-cream-50 px-page-gutter py-4">
        <div className="mx-auto flex max-w-page items-center justify-between gap-6">
          <Wordmark />

          {/* Desktop nav (lg+ only — admin has 7 items + user info). */}
          <nav
            aria-label="Admin"
            className="hidden items-center gap-5 lg:flex xl:gap-6"
          >
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
              >
                {item.label}
              </Link>
            ))}
            <span className="font-sans text-sm text-neutral-500">
              {user.name} · {user.role.toLowerCase()}
            </span>
            <LogoutButton />
          </nav>

          {/* Mobile / tablet drawer (below lg). */}
          <div className="lg:hidden">
            <MobileMenu
              items={ADMIN_NAV}
              showStamp={false}
              footer={
                <div className="border-t border-cream-200 pt-6">
                  <p className="m-0 mb-4 font-sans text-sm text-neutral-500">
                    {user.name} · {user.role.toLowerCase()}
                  </p>
                  <LogoutButton />
                </div>
              }
            />
          </div>
        </div>
      </header>
      <main className="bg-cream-50 px-page-gutter py-10 md:py-12">
        <div className="mx-auto max-w-page">{children}</div>
      </main>
    </>
  );
}
