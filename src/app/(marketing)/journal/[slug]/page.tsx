import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  coverAlt: string | null;
  authorName: string;
  category: string | null;
  tags: string[];
  publishedAt: string;
  wordCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
}

async function fetchPost(slug: string): Promise<Post | null> {
  try {
    return await apiFetch<Post>(`/blog/posts/${slug}`, {
      method: "GET",
      next: { revalidate: 60, tags: [`blog-post:${slug}`] },
      throwOnError: true,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) return { title: "Not found" };
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt;
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      images: post.ogImageUrl ?? post.coverUrl ?? undefined,
      publishedTime: post.publishedAt,
      authors: [post.authorName],
    },
  };
}

export default async function JournalPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Person", name: post.authorName },
    image: post.ogImageUrl ?? post.coverUrl ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": `/journal/${post.slug}` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Article schema for richer search results.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article>
        {post.coverUrl ? (
          <div
            aria-label={post.coverAlt ?? ""}
            role="img"
            className="aspect-[16/9] w-full bg-gradient-to-br from-orange-300 to-maroon-500"
            style={{
              backgroundImage: `url("${post.coverUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}

        <header className="px-page-gutter pb-8 pt-16">
          <div className="mx-auto max-w-prose">
            <p className="font-sans text-xs uppercase tracking-[0.22em] text-orange-600">
              {post.category ?? "Journal"} ·{" "}
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="mt-3 font-display text-5xl font-medium leading-tight text-maroon-600">
              {post.title}
            </h1>
            <p className="mt-4 font-display text-xl italic text-neutral-700">{post.excerpt}</p>
            <p className="mt-6 font-sans text-sm text-neutral-500">
              {post.authorName} · {Math.max(1, Math.round(post.wordCount / 220))} min read
            </p>
          </div>
        </header>

        <section className="px-page-gutter pb-24">
          <div
            className="mx-auto max-w-prose font-sans text-base leading-relaxed text-neutral-800
                       [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-medium [&_h2]:text-maroon-600
                       [&_h3]:mb-3 [&_h3]:mt-8  [&_h3]:font-display [&_h3]:text-2xl [&_h3]:font-medium [&_h3]:text-maroon-600
                       [&_p]:mb-5
                       [&_a]:text-orange-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-orange-700
                       [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:italic [&_blockquote]:text-neutral-700
                       [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6
                       [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6
                       [&_li]:mb-1
                       [&_img]:my-8 [&_img]:max-w-full
                       [&_code]:rounded [&_code]:bg-cream-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em]"
            // Body is sanitised server-side at write time. We still let React's
            // own escaping handle anything inert that slipped through.
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {post.tags.length > 0 ? (
            <div className="mx-auto mt-16 max-w-prose border-t border-cream-200 pt-6">
              <p className="font-sans text-xs uppercase tracking-[0.18em] text-neutral-500">Tags</p>
              <p className="mt-2 font-sans text-sm text-neutral-700">{post.tags.join(" · ")}</p>
            </div>
          ) : null}

          <div className="mx-auto mt-12 max-w-prose">
            <Link
              href="/journal"
              className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-orange-600 underline underline-offset-4"
            >
              ← Back to journal
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}
