import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { apiFetch } from "@/lib/api";

export const metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};

/**
 * Verify-email landing page. The /auth/verify-email API expects a POST,
 * so this is a server component that POSTs the token from the query string,
 * then redirects to /login on success or shows an error on failure.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <AuthShell title="Missing verification link" eyebrow="Email verification">
        <Alert variant="danger">No verification token was provided in the link.</Alert>
        <Button className="mt-4" onClick={undefined}>
          <a href="/login">Back to sign in</a>
        </Button>
      </AuthShell>
    );
  }

  try {
    await apiFetch("/auth/verify-email", {
      method: "POST",
      body: { token },
      cache: "no-store",
    });
  } catch {
    return (
      <AuthShell title="Verification link is invalid" eyebrow="Email verification">
        <Alert variant="danger">
          This verification link is invalid or has expired. Sign in and we&rsquo;ll send a fresh
          one.
        </Alert>
        <div className="mt-4">
          <a href="/login">
            <Button>Back to sign in</Button>
          </a>
        </div>
      </AuthShell>
    );
  }

  redirect("/login?status=verified");
}
