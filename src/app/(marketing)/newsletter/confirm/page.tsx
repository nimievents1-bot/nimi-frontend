import { type Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Newsletter confirmed",
  robots: { index: false, follow: false },
};

/**
 * Double-opt-in confirmation landing page.
 *
 * Uses the plain marketing wrapper (gutter + section padding) so the
 * global `<Header>` from the (marketing) layout sits cleanly above the
 * content. We do NOT use `<AuthShell>` here — that would render its
 * own brand chrome on top of the marketing header (the double-header
 * bug we hit on the gifting checkout success page).
 */
export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-page-gutter py-section-y">
        <p className="eyebrow mb-3">Newsletter</p>
        <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
          Missing confirmation link
        </h1>
        <Alert variant="danger">No confirmation token was provided in the link.</Alert>
      </div>
    );
  }

  try {
    await apiFetch("/newsletter/confirm", {
      method: "POST",
      body: { token },
      cache: "no-store",
    });
  } catch {
    return (
      <div className="mx-auto max-w-xl px-page-gutter py-section-y">
        <p className="eyebrow mb-3">Newsletter</p>
        <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
          That link didn&rsquo;t work
        </h1>
        <Alert variant="danger">
          The confirmation link is invalid or has expired. You can sign up again from any page.
        </Alert>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-page-gutter py-section-y">
      <p className="eyebrow mb-3">Newsletter</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        You&rsquo;re in. Welcome.
      </h1>
      <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
        Thanks for confirming. Look out for the next note from our kitchen.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
      >
        Back to home
      </Link>
    </div>
  );
}
