import { type Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { Alert } from "@/components/primitives/Alert";
import { Tag } from "@/components/primitives/Tag";
import { apiFetch } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth";

import { CartActions } from "./CartActions";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

interface CartLine {
  itemId: string;
  cartItemId: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unitPriceMinor: number;
  currency: string;
  quantity: number;
  lineTotalMinor: number;
  available: boolean;
}

interface CartView {
  lines: CartLine[];
  subtotalMinor: number;
  currency: string;
  creditBalanceMinor: number;
  applicableCreditMinor: number;
  payableMinor: number;
  meetsMinimum: boolean;
}

const fmt = (minor: number, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSessionUser();
  const { status } = await searchParams;
  const cookieHeader = (await cookies()).toString();

  let view: CartView | null = null;
  let error: string | null = null;
  try {
    view = await apiFetch<CartView>("/pastry-cart", {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load your cart.";
  }

  const empty = !view || view.lines.length === 0;

  return (
    <>
      <p className="eyebrow mb-2">The Indulgence Club</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Your cart
      </h1>

      {status === "cancelled" ? (
        <div className="mb-6 border-l-4 border-orange-500 bg-cream-100 px-6 py-4">
          <p className="m-0 font-sans text-sm text-neutral-700">
            Checkout was cancelled — your cart is exactly as you left it.
          </p>
        </div>
      ) : null}

      {error ? (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      {empty ? (
        <div className="border border-dashed border-cream-200 bg-paper p-10 text-center">
          <p className="m-0 mb-4 font-sans text-base text-neutral-700">
            Your cart is empty.
          </p>
          <Link
            href="/cravings"
            className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
          >
            Browse the menu
          </Link>
        </div>
      ) : view ? (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Lines + actions */}
          <section>
            <ul className="m-0 list-none space-y-4 p-0">
              {view.lines.map((line) => (
                <li
                  key={line.cartItemId}
                  className="flex flex-wrap items-start gap-4 border border-cream-200 bg-paper p-4"
                >
                  <div
                    aria-hidden
                    className="aspect-square w-24 flex-none bg-gradient-to-br from-orange-300 to-maroon-700"
                    style={
                      line.imageUrl
                        ? {
                            backgroundImage: `url("${line.imageUrl}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="m-0 font-display text-xl text-maroon-600">
                        {line.name}
                      </h2>
                      <span className="font-display text-base text-orange-700">
                        {fmt(line.lineTotalMinor, line.currency)}
                      </span>
                    </div>
                    {line.description ? (
                      <p className="mt-1 max-w-prose font-sans text-sm text-neutral-700">
                        {line.description}
                      </p>
                    ) : null}
                    {!line.available ? (
                      <p className="mt-2 font-sans text-xs text-semantic-danger">
                        No longer available — please remove this item.
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <CartActions
                        cartItemId={line.cartItemId}
                        quantity={line.quantity}
                        unitPriceMinor={line.unitPriceMinor}
                        currency={line.currency}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 font-sans text-xs italic text-neutral-500">
              Prices update live — what you see here is what you&rsquo;ll be charged.
            </p>
          </section>

          {/* Summary + checkout form */}
          <aside className="space-y-6">
            <section className="border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-4 font-display text-2xl text-maroon-600">
                Order summary
              </h2>
              <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-2 font-sans text-sm">
                <dt className="text-neutral-700">Subtotal</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {fmt(view.subtotalMinor, view.currency)}
                </dd>
                <dt className="text-neutral-700">Indulgence Credits applied</dt>
                <dd className="text-right font-medium text-orange-700">
                  −{fmt(view.applicableCreditMinor, view.currency)}
                </dd>
                <dt className="border-t border-cream-200 pt-3 font-medium text-maroon-700">
                  Payable today
                </dt>
                <dd className="border-t border-cream-200 pt-3 text-right font-display text-2xl font-medium text-maroon-700">
                  {fmt(view.payableMinor, view.currency)}
                </dd>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Tag variant={view.meetsMinimum ? "success" : "orange"}>
                  {view.meetsMinimum
                    ? "Meets £25 minimum"
                    : `£${((2500 - view.subtotalMinor) / 100).toFixed(2)} below minimum`}
                </Tag>
                {view.creditBalanceMinor > 0 ? (
                  <Tag>
                    Credit balance {fmt(view.creditBalanceMinor, view.currency)}
                  </Tag>
                ) : null}
              </div>
            </section>

            <section className="border border-cream-200 bg-paper p-6">
              <h2 className="m-0 mb-4 font-display text-2xl text-maroon-600">
                Delivery details
              </h2>
              <CheckoutForm
                meetsMinimum={view.meetsMinimum}
                anyUnavailable={view.lines.some((l) => !l.available)}
              />
            </section>
          </aside>
        </div>
      ) : null}
    </>
  );
}
