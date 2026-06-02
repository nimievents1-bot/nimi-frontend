import { type Metadata } from "next";
import Link from "next/link";

import { ServiceTierEditor } from "../ServiceTierEditor";

export const metadata: Metadata = {
  title: "Admin · New tier",
  robots: { index: false, follow: false },
};

export default function NewServiceTierPage() {
  return (
    <>
      <p className="eyebrow mb-2">
        <Link
          href="/admin/tiers"
          className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
        >
          Service tiers
        </Link>{" "}
        · New
      </p>
      <h1 className="m-0 mb-6 font-display text-4xl font-medium text-maroon-600">
        New tier
      </h1>
      <ServiceTierEditor mode="create" />
    </>
  );
}
