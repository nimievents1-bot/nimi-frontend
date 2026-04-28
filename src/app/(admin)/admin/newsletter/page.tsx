import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Newsletter",
  robots: { index: false, follow: false },
};

export default function AdminNewsletterIndex() {
  return (
    <>
      <p className="eyebrow mb-3">Admin · Newsletter</p>
      <h1 className="m-0 mb-3 font-display text-5xl font-medium text-maroon-600">Newsletter</h1>
      <p className="mb-8 max-w-prose font-sans text-base text-neutral-700">
        Subscriber list, exports and broadcast composer arrive in Phase 6. Subscriptions confirmed
        through the public flow are already syncing to the database.
      </p>
    </>
  );
}
