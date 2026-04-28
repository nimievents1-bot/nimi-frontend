import { type Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Newsletter confirmed",
  robots: { index: false, follow: false },
};

export default async function ConfirmNewsletterPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <AuthShell title="Missing confirmation link" eyebrow="Newsletter">
        <Alert variant="danger">No confirmation token was provided in the link.</Alert>
      </AuthShell>
    );
  }

  try {
    await apiFetch("/newsletter/confirm", {
      method: "POST",
      body: { token },
      cache: "no-store",
    });
  } catch {
    return (
      <AuthShell title="That link didn't work" eyebrow="Newsletter">
        <Alert variant="danger">
          The confirmation link is invalid or has expired. You can sign up again from any page.
        </Alert>
        <div className="mt-4">
          <a href="/">
            <Button>Back to home</Button>
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Newsletter"
      title="You're in. Welcome."
      lede="Thanks for confirming. Look out for the next note from our kitchen."
    >
      <a href="/">
        <Button>Back to home</Button>
      </a>
    </AuthShell>
  );
}
