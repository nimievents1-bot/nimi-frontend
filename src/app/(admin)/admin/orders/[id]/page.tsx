import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";

import { AdminOrderActions } from "./AdminOrderActions";

export const metadata = { robots: { index: false, follow: false } };

interface AdminOrder {
  id: string;
  reference: string;
  status: string;
  name: string;
  email: string;
  totalMinor: number;
  currency: string;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  paidAt: string | null;
  approvedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  stripePaymentIntentId: string | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPriceMinor: number;
    totalMinor: number;
    customisation: Record<string, string> | null;
    collectionSnapshot: { name: string; description: string };
  }>;
}

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const cookieHeader = (await cookies()).toString();

  let order: AdminOrder | null = null;
  try {
    order = await apiFetch<AdminOrder>(`/admin/gifting/orders/${params.id}`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch {
    notFound();
  }

  if (!order) notFound();

  const fmt = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: order.currency.toUpperCase(),
  });

  return (
    <>
      <p className="eyebrow mb-2">Admin · Orders</p>
      <h1 className="m-0 mb-3 font-display text-4xl font-medium text-maroon-600">
        {order.reference}
      </h1>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Tag>{order.status.replace(/_/g, " ").toLowerCase()}</Tag>
        <span className="font-sans text-sm text-neutral-500">
          received {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <section className="mb-8 border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">Customer</h2>
            <p className="m-0 text-neutral-800">{order.name}</p>
            <p className="m-0">
              <a className="text-orange-600 underline underline-offset-4" href={`mailto:${order.email}`}>
                {order.email}
              </a>
            </p>
          </section>

          <section className="mb-8 border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-4 font-display text-2xl font-medium text-maroon-600">Items</h2>
            {order.items.map((item) => (
              <div key={item.id} className="border-b border-cream-200 py-3 last:border-0">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg text-maroon-600">
                    {item.quantity} × {item.collectionSnapshot.name}
                  </span>
                  <span className="font-sans text-base text-neutral-800">
                    {fmt.format(item.totalMinor / 100)}
                  </span>
                </div>
                {item.customisation ? (
                  <dl className="mt-2 grid grid-cols-[140px_1fr] gap-y-1 font-sans text-sm">
                    {item.customisation.names ? (
                      <>
                        <dt className="text-neutral-500">Names</dt>
                        <dd className="text-neutral-800">{item.customisation.names}</dd>
                      </>
                    ) : null}
                    {item.customisation.colourTheme ? (
                      <>
                        <dt className="text-neutral-500">Colour theme</dt>
                        <dd className="text-neutral-800">{item.customisation.colourTheme}</dd>
                      </>
                    ) : null}
                    {item.customisation.message ? (
                      <>
                        <dt className="text-neutral-500">Message</dt>
                        <dd className="whitespace-pre-wrap text-neutral-800">
                          {item.customisation.message}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            ))}
            <div className="mt-3 flex items-baseline justify-between border-t border-cream-200 pt-3">
              <span className="font-sans text-base font-semibold text-neutral-800">Total</span>
              <span className="font-display text-xl font-semibold text-maroon-600">
                {fmt.format(order.totalMinor / 100)}
              </span>
            </div>
          </section>

          {order.notes ? (
            <section className="mb-8 border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-3 font-display text-2xl font-medium text-maroon-600">
                Customer notes
              </h2>
              <p className="m-0 whitespace-pre-wrap font-sans text-base text-neutral-800">
                {order.notes}
              </p>
            </section>
          ) : null}

          <section className="mb-8 border border-cream-200 bg-paper p-6">
            <h2 className="m-0 mb-3 font-display text-2xl font-medium text-maroon-600">Timeline</h2>
            <ul className="m-0 list-none p-0 font-sans text-sm">
              <li className="py-1 text-neutral-700">
                <span className="text-neutral-500">Received</span> ·{" "}
                {new Date(order.createdAt).toLocaleString()}
              </li>
              {order.paidAt ? (
                <li className="py-1 text-neutral-700">
                  <span className="text-neutral-500">Paid</span> ·{" "}
                  {new Date(order.paidAt).toLocaleString()}
                </li>
              ) : null}
              {order.approvedAt ? (
                <li className="py-1 text-neutral-700">
                  <span className="text-neutral-500">Approved</span> ·{" "}
                  {new Date(order.approvedAt).toLocaleString()}
                </li>
              ) : null}
              {order.shippedAt ? (
                <li className="py-1 text-neutral-700">
                  <span className="text-neutral-500">Shipped</span> ·{" "}
                  {new Date(order.shippedAt).toLocaleString()}
                </li>
              ) : null}
              {order.deliveredAt ? (
                <li className="py-1 text-neutral-700">
                  <span className="text-neutral-500">Delivered</span> ·{" "}
                  {new Date(order.deliveredAt).toLocaleString()}
                </li>
              ) : null}
            </ul>
          </section>
        </div>

        <aside>
          <AdminOrderActions
            orderId={order.id}
            currentStatus={order.status}
            currentInternalNotes={order.internalNotes ?? ""}
          />
        </aside>
      </div>
    </>
  );
}
