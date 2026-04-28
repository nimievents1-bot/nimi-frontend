import { type Metadata } from "next";

import { requireSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await requireSessionUser();

  return (
    <>
      <p className="eyebrow mb-3">Profile</p>
      <h1 className="m-0 mb-6 font-display text-5xl font-medium text-maroon-600">Your details</h1>

      <dl className="grid max-w-prose grid-cols-[180px_1fr] gap-y-3 font-sans text-base">
        <dt className="text-neutral-500">Name</dt>
        <dd className="text-neutral-800">{user.name}</dd>
        <dt className="text-neutral-500">Email</dt>
        <dd className="text-neutral-800">{user.email}</dd>
        <dt className="text-neutral-500">Email verified</dt>
        <dd className="text-neutral-800">{user.emailVerifiedAt ? "Yes" : "Pending"}</dd>
        <dt className="text-neutral-500">Role</dt>
        <dd className="text-neutral-800">{user.role.toLowerCase()}</dd>
      </dl>

      <p className="mt-10 max-w-prose font-sans text-sm text-neutral-500">
        Editing profile details, addresses and email preferences arrives in the next phase.
      </p>
    </>
  );
}
