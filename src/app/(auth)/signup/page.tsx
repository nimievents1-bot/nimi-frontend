import { type Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";

import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Nimi Events account.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Welcome"
      title="Create your account"
      lede="It takes a minute. We'll send a quick email to verify."
      altPrompt={{ label: "Already have an account? Sign in →", href: "/login" }}
    >
      <SignupForm />
    </AuthShell>
  );
}
