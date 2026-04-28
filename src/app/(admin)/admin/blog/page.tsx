import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Blog",
  robots: { index: false, follow: false },
};

interface PostRow {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  authorName: string;
  category: string | null;
  publishedAt: string | null;
  updatedAt: string;
  wordCount: number;
}

interface ListResponse {
  rows: PostRow[];
  total: number;
}

const STATUS_VARIANT: Record<PostRow["status"], "orange" | "neutral" | "success"> = {
  DRAFT: "orange",
  SCHEDULED: "neutral",
  PUBLISHED: "success",
};

export default async function AdminBlogList({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const cookieHeader = (await cookies()).toString();

  const qs = new URLSearchParams();
  if (searchParams.status) qs.set("status", searchParams.status);
  if (searchParams.q) qs.set("q", searchParams.q);
  qs.set("limit", "100");

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/blog/posts?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load posts.";
  }

  return (
    <>
      <p className="eyebrow mb-2">Admin · Journal</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">Blog posts</h1>

      <form className="mb-6 flex flex-wrap items-end gap-4" method="get">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Status
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Search
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Title, excerpt, slug…"
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          />
        </label>
        <button
          type="submit"
          className="bg-maroon-600 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream-50 hover:bg-maroon-700"
        >
          Apply
        </button>
        <Link
          href="/admin/blog/new"
          className="bg-orange-600 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream-50 hover:bg-orange-700"
        >
          New post
        </Link>
      </form>

      {error ? <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p> : null}

      {!data || data.rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">
            No posts yet. Click "New post" to write your first entry.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {data.rows.map((p) => (
                <tr key={p.id} className="border-t border-cream-200">
                  <td className="px-4 py-3">
                    <div className="font-display text-base text-maroon-600">{p.title}</div>
                    <div className="text-xs text-neutral-500">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Tag variant={STATUS_VARIANT[p.status]}>{p.status.toLowerCase()}</Tag>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{p.authorName}</td>
                  <td className="px-4 py-3 text-neutral-700">{p.category ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-orange-600 underline underline-offset-4"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
