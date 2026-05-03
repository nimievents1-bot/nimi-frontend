"use client";

import { useState } from "react";

import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Turnstile } from "@/components/primitives/Turnstile";
import { ApiError, apiFetch } from "@/lib/api";

interface NewsletterFormProps {
  /** Identifier for analytics — which surface the user subscribed from. */
  source?: string;
  /** Override the default helper line shown beneath the submit button. */
  helperText?: string;
  /** Override the success alert content (defaults to a generic confirmation note). */
  successMessage?: string;
  /** Optional extra Tailwind classes for the wrapping form. */
  className?: string;
}

/**
 * Newsletter sign-up — client component reused in the Footer and the
 * homepage subscription panel.
 *
 * Subscribes via the API; the API responds 202 even if the email already
 * exists (anti-enumeration), so the success message is the same in
 * every case. The user receives a confirmation email regardless.
 *
 * `source` is forwarded as analytics metadata so we can later see which
 * surfaces convert (footer vs home vs contact, etc.).
 */
export function NewsletterForm({
  source = "footer",
  helperText = "We send a confirmation email. You can unsubscribe any time.",
  successMessage = "Check your inbox for a confirmation email — open it to activate your subscription.",
  className,
}: NewsletterFormProps = {}) {
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
        body: { email, source, turnstileToken: token },
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
      <div className={`mt-6 max-w-sm ${className ?? ""}`}>
        <Alert variant="success">{successMessage}</Alert>
      </div>
    );
  }

  // A stable per-source field id keeps multiple instances on a page (footer +
  // homepage) accessible without label collisions.
  const fieldId = `newsletter-email-${source}`;

  return (
    <form
      onSubmit={submit}
      className={`mt-2 w-full max-w-sm ${className ?? ""}`}
      aria-label="Newsletter signup"
      noValidate
    >
      <label htmlFor={fieldId} className="sr-only">
        Email address
      </label>
      <input
        id={fieldId}
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
      <p className="mt-3 font-sans text-xs text-neutral-500">{helperText}</p>
    </form>
  );
}
