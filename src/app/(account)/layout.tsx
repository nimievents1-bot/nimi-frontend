import Link from "next/link";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { Footer } from "@/components/patterns/Footer";
import { MobileMenu } from "@/components/patterns/MobileMenu";
import { requireSessionUser } from "@/lib/auth";

import { LogoutButton } from "./LogoutButton";

const ACCOUNT_NAV = [
  { label: "Overview", href: "/account" },
  { label: "Profile", href: "/account/profile" },
  { label: "Orders", href: "/account/orders" },
  { label: "Subscription", href: "/account/subscription" },
  { label: "Security", href: "/account/security" },
] as const;

/**
 * Account layout — gates access to authenticated pages.
 * `requireSessionUser` redirects to /login if no session is found.
 *
 * Responsive: nav collapses to a hamburger drawer below md.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  return (
    <>
      <header className="border-b border-cream-200 bg-cream-50 px-page-gutter py-4 md:py-5">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4">
          <Wordmark />

          {/* Desktop nav. */}
          <nav aria-label="Account" className="hidden items-center gap-6 md:flex">
            {ACCOUNT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
              >
                {item.label}
              </Link>
            ))}
            <span className="hidden font-sans text-sm text-neutral-500 lg:inline">{user.email}</span>
            <LogoutButton />
          </nav>

          {/* Mobile drawer trigger. */}
          <div className="md:hidden">
            <MobileMenu
              items={ACCOUNT_NAV}
              showStamp={false}
              footer={
                <div className="border-t border-cream-200 pt-6">
                  <p className="m-0 mb-4 font-sans text-sm text-neutral-500">{user.email}</p>
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
      <Footer />
    </>
  );
}
