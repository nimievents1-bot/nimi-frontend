import { type Metadata } from "next";
import Link from "next/link";

import { ShippingZoneEditor } from "../ShippingZoneEditor";

export const metadata: Metadata = {
  title: "Admin · New shipping zone",
  robots: { index: false, follow: false },
};

export default function NewShippingZonePage() {
  return (
    <>
      <p className="eyebrow mb-2">
        <Link
          href="/admin/shipping"
          className="text-orange-700 underline underline-offset-4 hover:text-orange-800"
        >
          Shipping
        </Link>{" "}
        · New
      </p>
      <h1 className="m-0 mb-6 font-display text-4xl font-medium text-maroon-600">
        New shipping zone
      </h1>
      <ShippingZoneEditor mode="create" />
    </>
  );
}
