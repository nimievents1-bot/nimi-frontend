"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

const Schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});
type FormValues = z.infer<typeof Schema>;

interface LoginFormProps {
  next?: string | undefined;
  status?: string | undefined;
}

type LoginRole = "CUSTOMER" | "EDITOR" | "SUPPORT" | "OWNER";

/**
 * Where a successful sign-in should land when the caller didn't pass an
 * explicit `?next=` deep-link. Staff land on the admin dashboard;
 * customers land on their account overview.
 *
 * Mirrors the server-side guard in `app/(account)/account/page.tsx`,
 * which redirects staff who arrive at /account through any other path
 * (bookmark, direct URL, MFA post-verify). Two layers means an
 * out-of-sync deploy can't ever leave staff stuck on the customer view.
 */
const STAFF_ROLES: ReadonlySet<LoginRole> = new Set(["OWNER", "EDITOR", "SUPPORT"]);
const defaultLandingFor = (role: LoginRole | undefined): string =>
  role && STAFF_ROLES.has(role) ? "/admin" : "/account";

export function LoginForm({ next, status }: LoginFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const initialNotice =
    status === "verified"
      ? "Email verified — you can sign in now."
      : status === "reset"
      ? "Password updated. Please sign in."
      : null;

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await apiFetch<
        | { mfaRequired: true; challengeToken: string }
        | { mfaRequired?: false; user: { id: string; role: LoginRole } }
      >("/auth/login", { method: "POST", body: values });

      // The `next` query-param wins — it preserves the user's intent on
      // deep-links like /cart-checkout, "Reorder", or any link gated by
      // the auth wall. Only fall back to a role-based default when the
      // caller didn't ask for somewhere specific.
      const explicitNext = next ?? params.get("next");

      if ("mfaRequired" in result && result.mfaRequired) {
        // Stash the challenge token in sessionStorage (cleared on tab close)
        // and redirect to the challenge page. Token is short-lived (5 min).
        sessionStorage.setItem("nimi.mfa.challenge", result.challengeToken);
        // Don't try to guess the role here — we haven't verified the code yet.
        // Default to /account; the server-side guard will bump staff to /admin
        // after MFA completes and they land on /account.
        const nextDest = explicitNext ?? "/account";
        router.push(`/mfa-challenge?next=${encodeURIComponent(nextDest)}`);
        return;
      }

      router.push(explicitNext ?? defaultLandingFor(result.user.role));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        // 429 (rate limit) and 423 (per-account lockout) deserve their own
        // wording — the raw NestJS detail ("ThrottlerException: Too Many
        // Requests") is unfriendly and gives away implementation details.
        if (err.status === 429) {
          setServerError(
            "Too many sign-in attempts from this device. Please wait a minute and try again.",
          );
        } else if (err.status === 423 || /lock/i.test(err.detail)) {
          setServerError(
            "This account is temporarily locked after several failed attempts. Try again in 15 minutes, or reset your password.",
          );
        } else if (err.status === 401) {
          // Anti-enumeration: same wording for "no such email" and "wrong password".
          setServerError("That email or password isn't right. Please try again.");
        } else {
          setServerError(err.detail || "Something went wrong. Please try again.");
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  });

  return (
    <form noValidate onSubmit={submit}>
      {initialNotice ? (
        <Alert variant="success" className="mb-4">
          {initialNotice}
        </Alert>
      ) : null}
      {serverError ? (
        <Alert variant="danger" className="mb-4">
          {serverError}
        </Alert>
      ) : null}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="mb-4 text-right">
        <Link
          href="/forgot-password"
          className="font-sans text-sm text-orange-600 underline underline-offset-4 hover:text-orange-700"
        >
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
