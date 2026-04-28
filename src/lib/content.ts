import "server-only";

import { apiFetch } from "./api";

/**
 * Fetch a published ContentBlock for a (page, key) pair.
 *
 * Returns `null` if the block doesn't exist yet — components should
 * fall back to sensible static defaults rather than crashing the page.
 *
 * Caching:
 *   - Tagged so on-demand revalidation can target a specific block.
 *   - 60-second background revalidation.
 *   - Tag format: `content:<page>:<key>`. Use `revalidateTag(tag)` from
 *     a server action (e.g. when the admin publishes) to invalidate.
 */
export interface PublishedBlock<T = Record<string, unknown>> {
  type: string;
  payload: T;
  version: number;
  publishedAt: string;
}

export async function getBlock<T = Record<string, unknown>>(
  page: string,
  key: string,
  locale = "en",
): Promise<PublishedBlock<T> | null> {
  try {
    return await apiFetch<PublishedBlock<T>>(`/content/${page}/${key}?locale=${locale}`, {
      method: "GET",
      next: { revalidate: 60, tags: [`content:${page}:${key}`] },
      throwOnError: true,
    });
  } catch {
    return null;
  }
}
