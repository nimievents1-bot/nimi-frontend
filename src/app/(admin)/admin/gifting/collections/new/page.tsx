import { type Metadata } from "next";
import Link from "next/link";

import { CollectionEditor } from "../CollectionEditor";

export const metadata: Metadata = {
  title: "Admin · New gift collection",
  robots: { index: false, follow: false },
};

/**
 * Create-mode wrapper. Renders the shared editor without a `row`
 * prop so it starts blank. On successful create the editor pushes
 * the router to the new record's edit page.
 */
export default function NewGiftCollectionPage() {
  return (
    <>
      <p className="eyebrow mb-2">
        <Link
          href="/admin/gifting/collections"
          className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
        >
          Gift collections
        </Link>{" "}
        · New
      </p>
      <h1 className="m-0 mb-6 font-display text-4xl font-medium text-maroon-600">
        New gift collection
      </h1>
      <CollectionEditor mode="create" />
    </>
  );
}
