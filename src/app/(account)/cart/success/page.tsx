import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default async function CartSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-xl py-10">
      <p className="eyebrow mb-3">Confirmed</p>
      <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
        Thank you.
      </h1>
      <p className="mb-6 max-w-prose font-sans text-lg text-neutral-700">
        Your order is in. We&rsquo;ll prepare it freshly and let you know when it&rsquo;s
        on its way.
      </p>

      {order ? (
        <p className="mb-8 border-l-4 border-orange-500 bg-cream-100 px-6 py-4 font-sans text-sm text-neutral-800">
          Reference:{" "}
          <strong className="font-display text-base text-maroon-700">{order}</strong>
        </p>
      ) : null}

      <p className="mb-8 max-w-prose font-sans text-sm text-neutral-700">
        A confirmation email is on its way. You can also see the order in your
        account at any time.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center bg-maroon-600 px-6 py-3 font-display text-lg italic text-cream-50 hover:bg-maroon-700"
        >
          View my orders
        </Link>
        <Link
          href="/cravings"
          className="inline-flex items-center justify-center border border-cream-200 bg-cream-100 px-6 py-3 font-display text-lg italic text-maroon-700 hover:border-orange-200 hover:bg-orange-100"
        >
          Back to the menu
        </Link>
      </div>
    </div>
  );
}
