import { type Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false, follow: false },
};

export default async function UnsubscribeNewsletterPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <AuthShell title="Missing unsubscribe link" eyebrow="Newsletter">
        <Alert variant="danger">No unsubscribe token was provided.</Alert>
      </AuthShell>
    );
  }

  try {
    await apiFetch("/newsletter/unsubscribe", {
      method: "POST",
      body: { token },
      cache: "no-store",
    });
  } catch {
    return (
      <AuthShell title="That link didn't work" eyebrow="Newsletter">
        <Alert variant="danger">
          The unsubscribe link is invalid. If you keep receiving newsletters in error, write to us
          at hello@nimievents.co.uk and we&rsquo;ll remove you manually.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Newsletter"
      title="You're unsubscribed."
      lede="You won't receive any more newsletters from us. The door's always open if you change your mind."
    >
      <a href="/">
        <Button>Back to home</Button>
      </a>
    </AuthShell>
  );
}
