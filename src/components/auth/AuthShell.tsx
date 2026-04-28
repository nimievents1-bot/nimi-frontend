import Link from "next/link";

import { Footer } from "@/components/patterns/Footer";
import { Wordmark } from "@/components/brand/NimiPotMark";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
  /** Footer link below the form, e.g. "Don't have an account? Sign up." */
  altPrompt?: { label: string; href: string };
}

/**
 * Shell layout for /login, /signup, /forgot-password, etc.
 * Brand-styled, centered, light cream surface. Reuses the wordmark and footer.
 */
export function AuthShell({ eyebrow, title, lede, children, altPrompt }: AuthShellProps) {
  return (
    <>
      <header className="border-b border-cream-200 bg-cream-50 px-page-gutter py-5">
        <div className="mx-auto max-w-page">
          <Wordmark />
        </div>
      </header>
      <main className="bg-cream-50 px-page-gutter py-16">
        <div className="mx-auto max-w-md">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">{title}</h1>
          {lede ? (
            <p className="mb-8 font-display text-xl italic text-neutral-700">{lede}</p>
          ) : null}
          <div className="mt-2">{children}</div>
          {altPrompt ? (
            <p className="mt-8 font-sans text-sm text-neutral-700">
              <Link
                href={altPrompt.href}
                className="text-orange-600 underline underline-offset-4 hover:text-orange-700"
              >
                {altPrompt.label}
              </Link>
            </p>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
