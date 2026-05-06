import { type Metadata } from "next";
import Link from "next/link";

import { PastryEditor } from "../PastryEditor";

export const metadata: Metadata = {
  title: "New pastry · Admin",
  robots: { index: false, follow: false },
};

export default function NewPastryPage() {
  return (
    <>
      <p className="eyebrow mb-2">
        Admin · Menu ·{" "}
        <Link href="/admin/menu" className="text-orange-700 underline underline-offset-4">
          back to list
        </Link>
      </p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        New menu item
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Create a new pastry, drink or savoury item. Save as <em>hidden</em> first if
        you want to preview before exposing to customers — flip the
        <strong> available</strong> toggle once it&rsquo;s ready.
      </p>

      <section className="border border-cream-200 bg-paper p-6">
        <PastryEditor mode="create" />
      </section>
    </>
  );
}
