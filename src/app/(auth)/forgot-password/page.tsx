import { type Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Nimi Events password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Forgot your password?"
      lede="No worries. Enter your email and we'll send a reset link if we have an account."
      altPrompt={{ label: "Remembered? Sign in →", href: "/login" }}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
