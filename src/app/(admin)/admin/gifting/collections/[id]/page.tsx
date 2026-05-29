import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";

import { CollectionEditor, type CollectionRow } from "../CollectionEditor";

export const metadata: Metadata = {
  title: "Admin · Edit gift collection",
  robots: { index: false, follow: false },
};

/**
 * Edit-mode wrapper. Fetches the existing row by id and hands it to
 * the shared editor as the `row` prop. 404 if the id doesn't exist
 * (deleted between tabs, mistyped, etc.).
 */
export default async function EditGiftCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  let row: CollectionRow;
  try {
    row = await apiFetch<CollectionRow>(`/admin/gifting/collections/${id}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <>
      <p className="eyebrow mb-2">
        <Link
          href="/admin/gifting/collections"
          className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
        >
          Gift collections
        </Link>{" "}
        · Edit
      </p>
      <h1 className="m-0 mb-6 font-display text-4xl font-medium text-maroon-600">
        {row.name}
      </h1>
      <CollectionEditor mode="edit" row={row} />
    </>
  );
}
