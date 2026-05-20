import { type Metadata } from "next";
import { Suspense } from "react";

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
      {/*
        Suspense boundary is mandatory in Next 16 for any client tree
        that calls `useSearchParams()` — without it, the static
        prerender phase bails with "missing-suspense-with-csr-bailout"
        and the build fails. SignupForm reads `?next=...` to honour
        the guest-cart sign-up flow, so it sits inside the boundary
        here. Fallback is null because the form is small and we'd
        rather show nothing for a beat than a skeleton that flashes.
      */}
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
