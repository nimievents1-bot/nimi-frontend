"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

interface Props {
  next: string;
}

const CHALLENGE_KEY = "nimi.mfa.challenge";

/**
 * Reads the short-lived challenge token from sessionStorage (set by the
 * login form), prompts for the TOTP code, posts to /auth/mfa/challenge.
 *
 * If sessionStorage doesn't have a token (e.g. user landed here directly),
 * we redirect back to /login.
 */
export function MfaChallengeForm({ next }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(CHALLENGE_KEY);
    setHasToken(Boolean(token));
    if (!token) {
      // No challenge in flight — send them back to the login screen.
      router.replace("/login");
    }
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    const challengeToken = sessionStorage.getItem(CHALLENGE_KEY);
    if (!challengeToken) {
      router.replace("/login");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/auth/mfa/challenge", {
        method: "POST",
        body: { challengeToken, code },
      });
      sessionStorage.removeItem(CHALLENGE_KEY);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't verify the code. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (hasToken === false) return null;

  return (
    <form noValidate onSubmit={submit}>
      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <TextField
        label="Authenticator code"
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        hint="Open your authenticator app and enter the current six-digit code."
      />

      <Button type="submit" block disabled={pending || code.length !== 6}>
        {pending ? "Verifying…" : "Verify and sign in"}
      </Button>

      <p className="mt-4 font-sans text-xs text-neutral-500">
        Lost access to your authenticator? Email{" "}
        <a className="text-orange-600 underline underline-offset-4" href="mailto:hello@nimievents.co.uk">
          hello@nimievents.co.uk
        </a>{" "}
        from your account email and we&rsquo;ll help you regain access.
      </p>
    </form>
  );
}
