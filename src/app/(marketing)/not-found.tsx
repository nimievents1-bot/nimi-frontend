import Link from "next/link";

import { Button } from "@/components/primitives/Button";

/**
 * Route-group-scoped 404 for the marketing surface.
 *
 * Why this exists separately from `app/not-found.tsx`:
 *   When `notFound()` is called from inside a `(marketing)` page (for
 *   example, `/gifting/[slug]` when the API returns no matching
 *   collection), Next.js looks for the nearest `not-found.tsx`. If only
 *   the root-level one existed, Next would render BOTH:
 *     - `(marketing)/layout.tsx` (which already paints the header
 *       + footer for everything under this segment)
 *     - `app/not-found.tsx` (which paints its own header + footer too)
 *   That doubled the chrome — two headers stacked at the top of the
 *   404 page.
 *
 *   By providing this file, Next picks it ahead of the root one and
 *   renders the body content INSIDE the marketing layout. One header,
 *   one footer, layout consistent with every other public page.
 *
 *   `app/not-found.tsx` still exists for unmatched URLs that have no
 *   parent layout (e.g. a path that doesn't fall under any route
 *   group). That file paints its own chrome because no layout will.
 */
export default function MarketingNotFound() {
  return (
    <main className="flex min-h-[calc(100vh-320px)] items-center justify-center bg-cream-50 px-page-gutter py-section-y">
      <div className="max-w-prose text-center">
        <p className="eyebrow mb-3">404</p>
        <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
          That page isn&rsquo;t on the menu.
        </h1>
        <p className="mb-8 font-sans text-base text-neutral-700">
          The link may be old, or the page may have moved. Try the homepage or get in touch.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary">Get in touch</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
