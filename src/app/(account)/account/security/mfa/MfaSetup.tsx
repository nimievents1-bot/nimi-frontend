"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { TextField } from "@/components/primitives/Field";
import { ApiError, apiFetch } from "@/lib/api";

type State =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "scan"; otpauthUrl: string; secret: string }
  | { phase: "confirmed" };

/**
 * MfaSetup — orchestrates the enrolment flow.
 *
 * 1. Click "Set up" → POST /auth/mfa/setup/begin → render QR + secret.
 * 2. User scans QR with their authenticator, types the resulting code.
 * 3. POST /auth/mfa/setup/confirm → done.
 *
 * If the user navigates away mid-flow we fire `setup/cancel` to clean up
 * the staged secret on the server.
 */
export function MfaSetup() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (state.phase === "scan") {
        // Best-effort cleanup if the user navigates away.
        void apiFetch("/auth/mfa/setup/cancel", { method: "POST", throwOnError: false }).catch(
          () => undefined,
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = async () => {
    setError(null);
    setState({ phase: "starting" });
    try {
      const result = await apiFetch<{ otpauthUrl: string; secret: string }>(
        "/auth/mfa/setup/begin",
        { method: "POST" },
      );
      setState({ phase: "scan", otpauthUrl: result.otpauthUrl, secret: result.secret });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Couldn't start setup.");
      setState({ phase: "idle" });
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/auth/mfa/setup/confirm", { method: "POST", body: { code } });
      setState({ phase: "confirmed" });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "That code didn't match.");
    } finally {
      setPending(false);
    }
  };

  if (state.phase === "confirmed") {
    return (
      <Alert variant="success">
        Two-step verification is on. From now on you&rsquo;ll be asked for a code from your
        authenticator app every time you sign in.
      </Alert>
    );
  }

  if (state.phase === "scan") {
    return (
      <div>
        {error ? (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}
        <p className="mb-6 max-w-prose font-sans text-base text-neutral-700">
          Open your authenticator app, scan the QR code below, then enter the six-digit code it
          shows.
        </p>

        <div className="mb-6 flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="border border-cream-200 bg-paper p-4">
            <QRCodeSVG value={state.otpauthUrl} size={192} bgColor="#FFFFFF" fgColor="#5C1F18" level="M" />
          </div>
          <div>
            <p className="m-0 font-sans text-sm text-neutral-700">
              Can&rsquo;t scan? Enter this secret manually:
            </p>
            <pre className="mt-2 max-w-full overflow-x-auto rounded bg-cream-100 px-3 py-2 font-mono text-sm text-maroon-700">
              {state.secret}
            </pre>
          </div>
        </div>

        <form onSubmit={confirm} className="max-w-sm">
          <TextField
            label="Code from app"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button type="submit" block disabled={pending || code.length !== 6}>
            {pending ? "Verifying…" : "Confirm and turn on"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-prose">
      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <p className="mb-6 font-sans text-base text-neutral-700">
        We&rsquo;ll generate a secret you can scan with any TOTP authenticator app. After scanning,
        you&rsquo;ll confirm with the first code your app produces.
      </p>
      <Button onClick={() => void begin()} disabled={state.phase === "starting"}>
        {state.phase === "starting" ? "Starting…" : "Set up two-step verification"}
      </Button>
    </div>
  );
}
