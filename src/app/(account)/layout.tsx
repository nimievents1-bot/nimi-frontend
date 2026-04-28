import Link from "next/link";

import { Footer } from "@/components/patterns/Footer";
import { Wordmark } from "@/components/brand/NimiPotMark";
import { requireSessionUser } from "@/lib/auth";

import { LogoutButton } from "./LogoutButton";

/**
 * Account layout — gates access to authenticated pages.
 * `requireSessionUser` redirects to /login if no session is found.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  return (
    <>
      <header className="border-b border-cream-200 bg-cream-50 px-page-gutter py-5">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4">
          <Wordmark />
          <nav aria-label="Account" className="flex items-center gap-6">
            <Link
              href="/account"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Overview
            </Link>
            <Link
              href="/account/profile"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Profile
            </Link>
            <span className="font-sans text-sm text-neutral-500">{user.email}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="bg-cream-50 px-page-gutter py-12">
        <div className="mx-auto max-w-page">{children}</div>
      </main>
      <Footer />
    </>
  );
}
