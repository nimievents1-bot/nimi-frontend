import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Service tiers",
  robots: { index: false, follow: false },
};

interface TierRow {
  id: string;
  category: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: unknown;
  imageUrl: string | null;
  flagship: boolean;
  position: number;
  active: boolean;
  updatedAt: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  CATERING: "Catering tiers",
  EVENTS: "Event planning tiers",
};

/**
 * Admin list view for `ServiceTier`. Mirrors the structure used for
 * shipping zones and gift collections — grouped sections, status
 * tags, click-through to a per-row editor, "New" button at the top.
 *
 * The category split is editorial: a customer on `/catering` only
 * sees CATERING tiers, `/events` only sees EVENTS. The admin sees
 * both stacked here so it's one page of "every tier on the site".
 */
export default async function AdminServiceTiersPage() {
  const cookieHeader = (await cookies()).toString();

  let rows: TierRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await apiFetch<TierRow[]>("/admin/service-tiers", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Couldn't load tiers.";
  }

  const categoryOrder = ["CATERING", "EVENTS"];
  const grouped = categoryOrder.map((category) => ({
    category,
    rows: rows.filter((r) => r.category === category),
  }));

  return (
    <>
      <p className="eyebrow mb-2">Catalogue</p>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 font-display text-4xl font-medium text-maroon-600">
          Service tiers
        </h1>
        <Link
          href="/admin/tiers/new"
          className="inline-flex items-center justify-center bg-maroon-600 px-5 py-2.5 font-display text-base italic text-cream-50 hover:bg-maroon-700"
        >
          New tier
        </Link>
      </div>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Edit the tier cards shown on{" "}
        <Link href="/catering" className="text-orange-700 underline underline-offset-4">
          /catering
        </Link>{" "}
        and{" "}
        <Link href="/events" className="text-orange-700 underline underline-offset-4">
          /events
        </Link>
        . Add new tiers, edit copy, reorder, toggle Active off to take a tier
        offline without losing its slug history.
      </p>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {grouped.map(({ category, rows: catRows }) => (
        <section key={category} className="mb-10">
          <h2 className="m-0 mb-3 font-display text-2xl font-medium text-maroon-600">
            {CATEGORY_LABEL[category] ?? category}
          </h2>
          {catRows.length === 0 ? (
            <p className="border border-dashed border-cream-200 bg-paper p-6 font-sans text-sm text-neutral-700">
              No tiers in this category yet. Click &ldquo;New tier&rdquo; above to
              add one.
            </p>
          ) : (
            <div className="overflow-x-auto border border-cream-200 bg-paper">
              <table className="w-full border-collapse text-left">
                <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
                  <tr>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3 text-right">Position</th>
                    <th className="px-4 py-3">Flagship</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-sm">
                  {catRows.map((r) => (
                    <tr key={r.id} className="border-t border-cream-200">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tiers/${r.id}`}
                          className="font-display text-base text-maroon-700 underline underline-offset-4 hover:text-orange-700"
                        >
                          {r.title}
                        </Link>
                        <p className="m-0 mt-1 font-sans text-xs text-neutral-500">
                          {r.eyebrow}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                        {r.slug}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {r.position}
                      </td>
                      <td className="px-4 py-3">
                        {r.flagship ? <Tag variant="orange">Flagship</Tag> : null}
                      </td>
                      <td className="px-4 py-3">
                        {r.active ? (
                          <Tag variant="success">Active</Tag>
                        ) : (
                          <Tag variant="orange">Disabled</Tag>
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
