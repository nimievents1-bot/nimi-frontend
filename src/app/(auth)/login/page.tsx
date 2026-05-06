import { type Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Nimi Events account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; status?: string }>;
}) {
  const { next, status } = await searchParams;
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      lede="Pick up where you left off."
      altPrompt={{
        label: "New here? Create an account →",
        href: "/signup",
      }}
    >
      <Suspense fallback={null}>
        <LoginForm next={next} status={status} />
      </Suspense>
    </AuthShell>
  );
}
