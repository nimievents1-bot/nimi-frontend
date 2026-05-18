import Link from "next/link";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { CartIndicator } from "@/components/patterns/CartIndicator";
import { Footer } from "@/components/patterns/Footer";
import { MobileMenu } from "@/components/patterns/MobileMenu";
import { NotificationBell } from "@/components/patterns/NotificationBell";
import { requireSessionUser } from "@/lib/auth";

import { LogoutButton } from "./LogoutButton";

const ACCOUNT_NAV = [
  { label: "Overview", href: "/account" },
  { label: "Profile", href: "/account/profile" },
  { label: "Bookings", href: "/account/bookings" },
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

          {/*
            Desktop nav. The bell + cart icons live in their own
            sub-cluster after the nav links so they don't visually mix
            with the text links — they're action affordances rather
            than navigation. We always pass `isAuthed={true}` here:
            this layout is gated by `requireSessionUser` above, so by
            the time the bell renders we already know there's a
            session for the protected /notifications poll to use.
          */}
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
            <div className="flex items-center gap-2">
              <NotificationBell />
              <CartIndicator isAuthed />
            </div>
            <LogoutButton />
          </nav>

          {/*
            Mobile: cart + bell sit outside the drawer so the customer
            can reach them without opening the menu. Hamburger handles
            the rest of the nav.
          */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell />
            <CartIndicator isAuthed />
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
