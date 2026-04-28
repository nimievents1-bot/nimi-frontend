import { type Metadata } from "next";

import { NewBlockForm } from "./NewBlockForm";

export const metadata: Metadata = {
  title: "Admin · New content block",
  robots: { index: false, follow: false },
};

export default function NewContentBlockPage() {
  return (
    <>
      <p className="eyebrow mb-2">Admin · Content</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">New block</h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Pick the page, the key, and the block type. We&rsquo;ll create a draft you can fill in
        before publishing.
      </p>
      <NewBlockForm />
    </>
  );
}
