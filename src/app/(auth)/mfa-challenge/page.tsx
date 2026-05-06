import { type Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";

import { MfaChallengeForm } from "./MfaChallengeForm";

export const metadata: Metadata = {
  title: "Two-step verification",
  robots: { index: false, follow: false },
};

export default async function MfaChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell
      eyebrow="Two-step verification"
      title="One more step."
      lede="Enter the six-digit code from your authenticator app to finish signing in."
    >
      <MfaChallengeForm next={next ?? "/account"} />
    </AuthShell>
  );
}
