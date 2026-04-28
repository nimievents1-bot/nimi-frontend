import { type Metadata } from "next";

import { MfaSetup } from "./MfaSetup";

export const metadata: Metadata = {
  title: "Two-step verification",
  robots: { index: false, follow: false },
};

export default function MfaSetupPage() {
  return (
    <>
      <p className="eyebrow mb-2">Account · Security</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">
        Two-step verification
      </h1>

      <MfaSetup />
    </>
  );
}
