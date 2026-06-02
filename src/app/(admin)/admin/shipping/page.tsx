import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Admin · Shipping",
  robots: { index: false, follow: false },
};

interface ShippingZoneRow {
  id: string;
  name: string;
  description: string | null;
  postcodePrefixes: unknown;
  feeMinor: number;
  freeOverEnabled: boolean;
  freeOverMinor: number | null;
  active: boolean;
  position: number;
  updatedAt: string;
}

const fmtGBP = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

/**
 * Admin shipping list. Shows every zone (active + disabled) so the
 * operator can manage promo zones, default zones, and turn things
 * on/off without scrolling through filters.
 */
export default async function AdminShippingPage() {
  const cookieHeader = (await cookies()).toString();
  let rows: ShippingZoneRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await apiFetch<ShippingZoneRow[]>("/admin/shipping/zones", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Couldn't load shipping zones.";
  }

  return (
    <>
      <p className="eyebrow mb-2">Operations</p>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 font-display text-4xl font-medium text-maroon-600">
          Shipping
        </h1>
        <Link
          href="/admin/shipping/new"
          className="inline-flex items-center justify-center bg-maroon-600 px-5 py-2.5 font-display text-base italic text-cream-50 hover:bg-maroon-700"
        >
          New zone
        </Link>
      </div>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Delivery fee zones for UK postcodes. Each zone has its own base fee and
        optional free-delivery threshold. Customers see the fee computed against
        their postcode + cart subtotal at checkout. Disabled zones are skipped
        by the resolver — use Active off to temporarily take a zone offline.
      </p>

      {loadError ? (
        <Alert variant="danger" className="mb-6">
          {loadError}
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 mb-4 font-sans text-base text-neutral-700">
            No shipping zones yet. Without at least one active zone (or an
            active catch-all), the checkout will refuse orders.
          </p>
          <Link
            href="/admin/shipping/new"
            className="inline-flex items-center justify-center bg-maroon-600 px-5 py-2.5 font-display text-base italic text-cream-50 hover:bg-maroon-700"
          >
            Create the first zone
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-cream-200 bg-paper">
          <table className="w-full border-collapse text-left">
            <thead className="bg-cream-100 font-sans text-xs uppercase tracking-[0.18em] text-maroon-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Prefixes</th>
                <th className="px-4 py-3 text-right">Base fee</th>
                <th className="px-4 py-3">Free over</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm">
              {rows.map((r) => {
                const prefixes = Array.isArray(r.postcodePrefixes)
                  ? (r.postcodePrefixes as string[])
                  : [];
                return (
                  <tr key={r.id} className="border-t border-cream-200">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/shipping/${r.id}`}
                        className="font-display text-base text-maroon-700 underline underline-offset-4 hover:text-orange-700"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                      {prefixes.length === 0 ? (
                        <span className="italic text-orange-700">Catch-all (default)</span>
                      ) : (
                        prefixes.join(", ")
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base text-maroon-600">
                      {r.feeMinor === 0 ? "Free" : fmtGBP(r.feeMinor)}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {r.freeOverEnabled && r.freeOverMinor ? (
                        <Tag variant="success">Free over {fmtGBP(r.freeOverMinor)}</Tag>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.active ? (
                        <Tag variant="success">Active</Tag>
                      ) : (
                        <Tag variant="orange">Disabled</Tag>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
