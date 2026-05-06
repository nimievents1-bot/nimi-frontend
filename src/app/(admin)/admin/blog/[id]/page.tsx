import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";

import { PostEditor } from "./PostEditor";

export const metadata = { robots: { index: false, follow: false } };

interface AdminPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  coverAlt: string | null;
  authorName: string;
  category: string | null;
  tags: string[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  wordCount: number;
}

const STATUS_VARIANT: Record<AdminPost["status"], "orange" | "neutral" | "success"> = {
  DRAFT: "orange",
  SCHEDULED: "neutral",
  PUBLISHED: "success",
};

export default async function AdminBlogEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  // Distinguish a real 404 (post id doesn't exist) from a transient API
  // failure so an outage doesn't masquerade as a missing post.
  let post: AdminPost | null = null;
  let fetchError: string | null = null;
  try {
    post = await apiFetch<AdminPost>(`/admin/blog/posts/${id}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    fetchError = err instanceof Error ? err.message : "Failed to load post.";
  }

  if (fetchError) {
    return (
      <Alert variant="danger" className="mt-6">
        Couldn&rsquo;t load this post: {fetchError}
      </Alert>
    );
  }
  if (!post) notFound();

  return (
    <>
      <p className="eyebrow mb-2">Admin · Journal</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">{post.title}</h1>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Tag variant={STATUS_VARIANT[post.status]}>{post.status.toLowerCase()}</Tag>
        <span className="font-sans text-sm font-mono text-neutral-500">/{post.slug}</span>
        <span className="font-sans text-sm text-neutral-500">
          {post.wordCount} words ·{" "}
          {Math.max(1, Math.round(post.wordCount / 220))} min read
        </span>
      </div>

      <PostEditor initial={post} />
    </>
  );
}
