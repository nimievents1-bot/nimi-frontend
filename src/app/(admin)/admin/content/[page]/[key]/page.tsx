import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { ApiError, apiFetch } from "@/lib/api";

import { ContentEditor } from "./ContentEditor";

export const metadata = { robots: { index: false, follow: false } };

interface ContentBlockRow {
  id: string;
  page: string;
  key: string;
  locale: string;
  type: string;
  payload: Record<string, unknown>;
  version: number;
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: string;
}

export default async function AdminContentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string; key: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { page, key } = await params;
  const { locale: localeParam } = await searchParams;
  const locale = localeParam ?? "en";
  const cookieHeader = (await cookies()).toString();

  // Distinguish a real 404 (the block hasn't been drafted yet — call
  // `notFound()`) from a transient API failure (network, 5xx, expired
  // cookie). The earlier behaviour collapsed all errors into 404, which
  // hid genuine outages and confused operators.
  let block: ContentBlockRow | null = null;
  let fetchError: string | null = null;
  try {
    block = await apiFetch<ContentBlockRow>(
      `/content/admin/latest/${page}/${key}?locale=${locale}`,
      { method: "GET", headers: { Cookie: cookieHeader }, cache: "no-store" },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    fetchError = err instanceof Error ? err.message : "Failed to load block.";
  }

  if (fetchError) {
    return (
      <Alert variant="danger" className="mt-6">
        Couldn&rsquo;t load this block: {fetchError}
      </Alert>
    );
  }
  if (!block) notFound();

  const isPublished = Boolean(block.publishedAt);
  return (
    <>
      <p className="eyebrow mb-2">
        Admin · Content · {block.page}
      </p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">
        {block.key}
      </h1>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tag>v{block.version}</Tag>
        <Tag variant={isPublished ? "success" : "orange"}>
          {isPublished ? "Published" : "Draft"}
        </Tag>
        <Tag variant="maroon">{block.type}</Tag>
        <span className="font-sans text-sm text-neutral-500">
          last updated {new Date(block.updatedAt).toLocaleString()}
        </span>
      </div>
      {!isPublished ? (
        <Alert variant="warning" className="mb-6">
          This is a draft. Public visitors still see the previous published version until you publish this one.
        </Alert>
      ) : null}
      <ContentEditor initial={block} />
    </>
  );
}
