import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/primitives/Alert";
import { ApiError, apiFetch } from "@/lib/api";

import { PastryEditor, type PastryRow } from "../PastryEditor";

export const metadata: Metadata = {
  title: "Edit pastry · Admin",
  robots: { index: false, follow: false },
};

export default async function EditPastryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  // Distinguish a real 404 (id doesn't exist) from a transient API failure
  // — same pattern we use across the rest of the admin detail pages so
  // an outage doesn't masquerade as a missing item.
  let row: PastryRow | null = null;
  let fetchError: string | null = null;
  try {
    row = await apiFetch<PastryRow>(`/admin/pastries/${id}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    fetchError = err instanceof Error ? err.message : "Failed to load item.";
  }

  if (fetchError) {
    return (
      <Alert variant="danger" className="mt-6">
        Couldn&rsquo;t load this item: {fetchError}
      </Alert>
    );
  }
  if (!row) notFound();

  return (
    <>
      <p className="eyebrow mb-2">
        Admin · Menu ·{" "}
        <Link href="/admin/menu" className="text-orange-700 underline underline-offset-4">
          back to list
        </Link>
      </p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">
        {row.name}
      </h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Editing <code>/{row.slug}</code>. Changes save instantly when you click{" "}
        <strong>Save changes</strong>. Delete is permanent — past orders keep their
        snapshot of the item, but it stops appearing in new searches.
      </p>

      <section className="border border-cream-200 bg-paper p-6">
        <PastryEditor mode="edit" row={row} />
      </section>
    </>
  );
}
