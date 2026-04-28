import { type Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  return (
    <AuthShell
      eyebrow="Order"
      title="Checkout cancelled."
      lede="No payment has been taken. You can pick up where you left off any time."
    >
      <Alert variant="info">
        {searchParams.ref ? `Reference ${searchParams.ref}.` : null} If you ran into a problem during
        checkout, write to <a href="mailto:hello@nimievents.co.uk" className="underline">hello@nimievents.co.uk</a>{" "}
        and we&rsquo;ll help you complete the order.
      </Alert>
      <div className="mt-6">
        <Link href="/gifting">
          <Button>Back to gifting</Button>
        </Link>
      </div>
    </AuthShell>
  );
}
