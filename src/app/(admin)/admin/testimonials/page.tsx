import { type Metadata } from "next";
import { cookies } from "next/headers";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

import { TestimonialEditor } from "./TestimonialEditor";

export const metadata: Metadata = {
  title: "Admin · Testimonials",
  robots: { index: false, follow: false },
};

interface TestimonialRow {
  id: string;
  authorName: string;
  role: string | null;
  body: string;
  rating: number | null;
  eventType: string | null;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  rows: TestimonialRow[];
  total: number;
}

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: { isPublished?: string; q?: string };
}) {
  const cookieHeader = (await cookies()).toString();

  const qs = new URLSearchParams();
  if (searchParams.isPublished === "true") qs.set("isPublished", "true");
  if (searchParams.isPublished === "false") qs.set("isPublished", "false");
  if (searchParams.q) qs.set("q", searchParams.q);
  qs.set("limit", "100");

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/admin/testimonials?${qs.toString()}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load testimonials.";
  }

  return (
    <>
      <p className="eyebrow mb-2">Admin · Testimonials</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        Testimonials
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Customer reviews surfaced on the homepage. Only rows with{" "}
        <Tag variant="success">published</Tag> show publicly. Lower display-order numbers
        appear first; ties fall back to most recent.
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-4" method="get">
        <label className="flex flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Visibility
          <select
            name="isPublished"
            defaultValue={searchParams.isPublished ?? ""}
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          >
            <option value="">All</option>
            <option value="true">Published</option>
            <option value="false">Drafts only</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 font-sans text-xs uppercase tracking-[0.16em] text-neutral-700">
          Search
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Author, body, role…"
            className="border border-cream-200 bg-paper px-3 py-2 font-sans text-sm"
          />
        </label>
        <button
          type="submit"
          className="bg-maroon-600 px-5 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-cream-50 hover:bg-maroon-700"
        >
          Apply
        </button>
      </form>

      {error ? <p className="mb-6 font-sans text-sm text-semantic-danger">{error}</p> : null}

      <section className="mb-10 border border-cream-200 bg-paper p-6">
        <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">
          Add a testimonial
        </h2>
        <p className="mb-4 max-w-prose font-sans text-sm text-neutral-600">
          Get the customer's explicit consent for the display name and quote before
          publishing. We don't surface email addresses or full names that weren't agreed to.
        </p>
        <TestimonialEditor mode="create" />
      </section>

      {!data || data.rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 font-sans text-base text-neutral-700">
            No testimonials yet. Use the form above to add the first one — the homepage
            will continue showing the placeholder set until you publish at least one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.rows.map((row) => (
            <article
              key={row.id}
              className="border border-cream-200 bg-paper p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Tag variant={row.isPublished ? "success" : "orange"}>
                  {row.isPublished ? "published" : "draft"}
                </Tag>
                {row.rating ? (
                  <span
                    aria-label={`${row.rating} stars`}
                    className="font-sans text-sm text-orange-600"
                  >
                    {"★".repeat(row.rating)}
                  </span>
                ) : null}
                <span className="font-sans text-xs text-neutral-500">
                  Display order: {row.displayOrder}
                </span>
                <span className="font-sans text-xs text-neutral-500">
                  Updated {new Date(row.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="m-0 font-display text-xl text-maroon-600">
                {row.authorName}
              </h3>
              {row.role ? (
                <p className="m-0 font-sans text-xs uppercase tracking-[0.16em] text-neutral-500">
                  {row.role}
                </p>
              ) : null}
              <blockquote className="mb-4 mt-3 font-display text-lg italic text-neutral-800">
                “{row.body}”
              </blockquote>

              <details>
                <summary className="cursor-pointer font-sans text-sm text-orange-700 underline underline-offset-4">
                  Edit / unpublish / delete
                </summary>
                <div className="mt-4">
                  <TestimonialEditor mode="edit" row={row} />
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
