"use client";

import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Turnstile } from "@/components/primitives/Turnstile";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Newsletter sign-up — client component embedded in the Footer.
 *
 * Subscribes via the API; the API responds 202 even if the email already
 * exists (anti-enumeration), so the success message is the same in
 * every case. The user receives a confirmation email regardless.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return;
    if (!token) {
      setError("Please complete the bot-protection challenge.");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/newsletter/subscribe", {
        method: "POST",
        body: { email, source: "footer", turnstileToken: token },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 max-w-sm">
        <Alert variant="success">
          Check your inbox for a confirmation email — open it to activate your subscription.
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm" aria-label="Newsletter signup">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email address"
        className="w-full rounded-none border border-cream-200 bg-cream-50 px-4 py-3 font-sans text-base text-neutral-900 placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none"
      />
      {error ? (
        <p role="alert" className="mt-2 font-sans text-xs text-semantic-danger">
          {error}
        </p>
      ) : null}
      <Turnstile onToken={setToken} />
      <Button type="submit" variant="primary" size="sm" block className="mt-3" disabled={pending}>
        {pending ? "Subscribing…" : "Subscribe"}
      </Button>
      <p className="mt-3 font-sans text-xs text-neutral-500">
        We send a confirmation email. You can unsubscribe any time.
      </p>
    </form>
  );
}
