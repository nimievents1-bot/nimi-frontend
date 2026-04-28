import Link from "next/link";
import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand/NimiPotMark";
import { getSessionUser } from "@/lib/auth";

import { LogoutButton } from "../(account)/LogoutButton";

const ADMIN_ROLES = new Set(["OWNER", "EDITOR", "SUPPORT"]);

/**
 * Admin layout — gates the entire `/admin/*` namespace by role.
 *
 * Anyone without OWNER/EDITOR/SUPPORT lands here gets redirected to
 * `/login`. The decision is made server-side here and again in the API
 * via @Roles() on every admin endpoint, so even a forged cookie can't
 * read or write content.
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
          <nav aria-label="Admin" className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/content"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Content
            </Link>
            <Link
              href="/admin/enquiries"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Enquiries
            </Link>
            <Link
              href="/admin/orders"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Orders
            </Link>
            <Link
              href="/admin/cravings"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Cravings
            </Link>
            <Link
              href="/admin/blog"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Journal
            </Link>
            <Link
              href="/admin/audit"
              className="font-sans text-sm uppercase tracking-[0.18em] text-neutral-700 hover:text-orange-600"
            >
              Audit
            </Link>
            <span className="font-sans text-sm text-neutral-500">
              {user.name} · {user.role.toLowerCase()}
            </span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="bg-cream-50 px-page-gutter py-12">
        <div className="mx-auto max-w-page">{children}</div>
      </main>
    </>
  );
}
