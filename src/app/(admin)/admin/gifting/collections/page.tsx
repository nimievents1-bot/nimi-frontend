import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Gift collections",
  robots: { index: false, follow: false },
};

interface CollectionRow {
  id: string;
  slug: string;
  category: "CORPORATE" | "WEDDINGS" | "PRIVATE";
  name: string;
  description: string;
  items: unknown;
  unitPriceMinor: number;
  priceMaxMinor: number | null;
  currency: string;
  moq: number;
  leadTimeDays: number;
  imageUrl: string | null;
  published: boolean;
  position: number;
  updatedAt: string;
}

interface ListResponse {
  rows: CollectionRow[];
  total: number;
}

const CATEGORY_LABEL: Record<CollectionRow["category"], string> = {
  CORPORATE: "Corporate",
  WEDDINGS: "Weddings",
  PRIVATE: "Private",
};

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * Admin list view for gift collections.
 *
 * Shows every collection (published AND drafts) so the operator can
 * see the full catalogue at a glance. Groups by category in the
 * render so corporate, weddings and private boxes appear together
 * — matches how the public `/gifting` page presents them.
 *
 * Each row links into the editor at `/admin/gifting/collections/[id]`,
 * and a "New collection" button up top opens the create flow.
 */
export default async function AdminGiftingCollectionsPage() {
  const cookieHeader = (await cookies()).toString();

  let data: ListResponse | null = null;
  let loadError: string | null = null;
  try {
    data = await apiFetch<ListResponse>("/admin/gifting/collections", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Couldn't load gift collections.";
  }

  const rows = data?.rows ?? [];

  // Group by category so the catalogue reads in the same shape as
  // the public site. Categories appear in the canonical order
  // (CORPORATE → WEDDINGS → PRIVATE) regardless of how the API
  // happened to sort the rows.
  const categoryOrder: CollectionRow["category"][] = [
    "CORPORATE",
    "WEDDINGS",
    "PRIVATE",
  ];
  const grouped = categoryOrder.map((category) => ({
    category,
    rows: rows.filter((r) => r.category === category),
  }));

  return (
    <>
      <p className="eyebrow mb-2">Catalogue</p>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 font-display text-4xl font-medium text-maroon-600">
          Gift collections
        </h1>
        <Link
          href="/admin/gifting/collections/new"
          className="inline-flex items-center justify-center bg-maroon-600 px-5 py-2.5 font-display text-base italic text-cream-50 hover:bg-maroon-700"
        >
          New collection
        </Link>
      </div>

      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Edit, add or remove the gift boxes shown on{" "}
        <Link href="/gifting" className="text-orange-700 underline underline-offset-4">
          /gifting
        </Link>
        . Drafts (
        <Tag variant="orange">Draft</Tag>) are hidden from the public site
        until you tick the &ldquo;Published&rdquo; box in the editor.
      </p>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {grouped.map(({ category, rows: catRows }) => (
        <section key={category} className="mb-10">
          <h2 className="m-0 mb-3 font-display text-2xl font-medium text-maroon-600">
            {CATEGORY_LABEL[category]}
          </h2>
          {catRows.length === 0 ? (
            <p className="border border-dashed border-cream-200 bg-paper p-6 font-sans text-sm text-neutral-700">
              No {CATEGORY_LABEL[category].toLowerCase()} collections yet.
            </p>
          ) : (
            <div className="overflow-x-auto border border-cream-200 bg-paper">
              <table className="w-full border-collapse text-left">
                <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">MOQ</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-sm">
                  {catRows.map((c) => (
                    <tr key={c.id} className="border-t border-cream-200">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/gifting/collections/${c.id}`}
                          className="font-display text-base text-maroon-700 underline underline-offset-4 hover:text-orange-700"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                        {c.slug}
                      </td>
                      <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                        {c.priceMaxMinor && c.priceMaxMinor > c.unitPriceMinor
                          ? `${fmtGBP(c.unitPriceMinor, c.currency)}–${fmtGBP(
                              c.priceMaxMinor,
                              c.currency,
                            )}`
                          : fmtGBP(c.unitPriceMinor, c.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {c.moq}
                      </td>
                      <td className="px-4 py-3">
                        {c.published ? (
                          <Tag variant="success">Published</Tag>
                        ) : (
                          <Tag variant="orange">Draft</Tag>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
