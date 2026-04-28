import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Content",
  robots: { index: false, follow: false },
};

interface ContentRow {
  id: string;
  page: string;
  key: string;
  locale: string;
  type: string;
  version: number;
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: string;
}

export default async function AdminContentList() {
  const cookieHeader = (await cookies()).toString();

  let rows: ContentRow[] = [];
  let error: string | null = null;
  try {
    rows = await apiFetch<ContentRow[]>("/content/admin/list", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load content blocks.";
  }

  // Group by page+key, latest version first.
  const grouped = new Map<string, ContentRow[]>();
  for (const row of rows) {
    const k = `${row.page}/${row.key}/${row.locale}`;
    const arr = grouped.get(k) ?? [];
    arr.push(row);
    grouped.set(k, arr);
  }

  return (
    <>
      <p className="eyebrow mb-3">Admin · Content</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">Content blocks</h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Each row is one editable surface (a hero, a section intro, a FAQ list…). Drafts can be
        previewed before publish. Old versions are kept and can be rolled back.
      </p>

      {error ? (
        <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p>
      ) : null}

      {grouped.size === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">
            No content blocks yet. Create your first one with the new-block button below.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {[...grouped.entries()].map(([k, versions]) => {
                const latest = versions[0]!;
                const isPublished = Boolean(latest.publishedAt);
                return (
                  <tr key={k} className="border-t border-cream-200">
                    <td className="px-4 py-3 text-neutral-800">{latest.page}</td>
                    <td className="px-4 py-3 text-neutral-800">{latest.key}</td>
                    <td className="px-4 py-3 text-neutral-700">{latest.type}</td>
                    <td className="px-4 py-3 text-neutral-700">v{latest.version}</td>
                    <td className="px-4 py-3">
                      {isPublished ? (
                        <Tag variant="success">Published</Tag>
                      ) : (
                        <Tag variant="orange">Draft</Tag>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(latest.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/content/${latest.page}/${latest.key}?locale=${latest.locale}`}
                        className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 underline underline-offset-4 hover:text-orange-700"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/admin/content/new"
          className="inline-flex items-center justify-center gap-2 bg-maroon-600 px-7 py-3 font-display text-lg italic text-cream-50 transition-colors duration-base hover:bg-maroon-700"
        >
          New block
        </Link>
      </div>
    </>
  );
}
