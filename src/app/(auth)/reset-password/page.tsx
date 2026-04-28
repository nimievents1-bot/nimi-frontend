import { type Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/primitives/Alert";

import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  return (
    <AuthShell eyebrow="Account" title="Reset your password" lede="Choose a new password.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert variant="danger">No reset token was provided. Open the link from your email.</Alert>
      )}
    </AuthShell>
  );
}
