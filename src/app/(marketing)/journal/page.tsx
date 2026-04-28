import { type Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/patterns/Hero";
import { apiFetch } from "@/lib/api";
import { images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes from the kitchen — recipes, behind-the-scenes, gifting tips.",
};

interface PostListItem {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  coverAlt: string | null;
  authorName: string;
  category: string | null;
  publishedAt: string;
  wordCount: number;
}

interface ListResponse {
  rows: PostListItem[];
  total: number;
  limit: number;
  offset: number;
}

export default async function JournalPage() {
  let data: ListResponse | null = null;
  try {
    data = await apiFetch<ListResponse>("/blog/posts?limit=24", {
      method: "GET",
      next: { revalidate: 60, tags: ["blog-posts"] },
      throwOnError: true,
    });
  } catch {
    data = { rows: [], total: 0, limit: 24, offset: 0 };
  }

  return (
    <>
      <Hero
        height="short"
        eyebrow="Journal"
        title="Notes from the kitchen."
        lede="Recipes, behind-the-scenes, gifting tips and the odd opinion."
        imageUrl={images.hero.journal}
      />
      <section className="px-page-gutter py-20">
        <div className="mx-auto max-w-page">
          {data.rows.length === 0 ? (
            <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
              <p className="m-0 font-sans text-base text-neutral-700">
                No posts published yet. Check back soon — we publish a piece every couple of weeks.
              </p>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {data.rows.map((p) => (
                <article key={p.slug}>
                  <Link href={`/journal/${p.slug}`} className="block no-underline">
                    <div
                      aria-hidden
                      className="mb-4 aspect-[4/3] w-full bg-gradient-to-br from-orange-300 to-maroon-500"
                      style={{
                        backgroundImage: `url("${p.coverUrl ?? images.journal.defaultCover}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <p className="font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">
                      {p.category ?? "Journal"} ·{" "}
                      {new Date(p.publishedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-medium leading-snug text-maroon-600 hover:text-orange-700">
                      {p.title}
                    </h2>
                    <p className="mt-2 max-w-prose font-sans text-base text-neutral-700">
                      {p.excerpt}
                    </p>
                    <p className="mt-3 font-sans text-xs text-neutral-500">
                      {p.authorName} · {Math.max(1, Math.round(p.wordCount / 220))} min read
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
