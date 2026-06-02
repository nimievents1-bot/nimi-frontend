import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";

import {
  ServiceTierEditor,
  type ServiceTierRow,
} from "../ServiceTierEditor";

export const metadata: Metadata = {
  title: "Admin · Edit tier",
  robots: { index: false, follow: false },
};

export default async function EditServiceTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  let row: ServiceTierRow;
  try {
    row = await apiFetch<ServiceTierRow>(`/admin/service-tiers/${id}`, {
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
          href="/admin/tiers"
          className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
        >
          Service tiers
        </Link>{" "}
        · Edit
      </p>
      <h1 className="m-0 mb-6 font-display text-4xl font-medium text-maroon-600">
        {row.title}
      </h1>
      <ServiceTierEditor mode="edit" row={row} />
    </>
  );
}
