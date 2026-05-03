"use client";

import Script from "next/script";
import { useState } from "react";

import { Button } from "@/components/primitives/Button";

/**
 * CalBookingButton — opens a Cal.com booking modal for a specific event type.
 *
 * Cal.com (free tier) is the source of truth for paid consultations:
 *   - Owns the calendar and slot availability
 *   - Collects payment up-front via the bundled Stripe app (so unpaid
 *     bookings can never reach the calendar)
 *   - Sends confirmation emails, ICS files, reminders and reschedule links
 *
 * Setup contract (operator side):
 *   1. Create a Cal.com account (free tier).
 *   2. Connect a calendar (Google / Apple / Office 365).
 *   3. Connect the Stripe app (Settings → Apps → Stripe → connect).
 *   4. Create two event types:
 *        - "30 min consultation"   → slug `30min`, charge £10 in the Stripe app
 *        - "60 min full call"      → slug `60min`, charge £30 in the Stripe app
 *      (slugs must match `NEXT_PUBLIC_CAL_EVENT_30` / `_60` — the defaults
 *      already align with the names above.)
 *   5. Set `NEXT_PUBLIC_CAL_USERNAME` to your Cal.com handle in Vercel
 *      project settings, then redeploy.
 *
 * If the username isn't configured, the button surfaces a friendly message
 * instead of opening a broken widget.
 */

declare global {
  interface Window {
    /**
     * Cal.com global, attached by their `embed.js` once it loads.
     * The signature is loose because Cal.com forwards a variadic command API
     * (e.g. `Cal('init', { origin })`, `Cal('modal', { calLink })`).
     */
    Cal?: (...args: unknown[]) => void;
  }
}

interface CalBookingButtonProps {
  /** Cal.com username (e.g. "nimi-events"). */
  username?: string;
  /** Cal.com event type slug (e.g. "30min" or "60min"). */
  eventSlug: string;
  /** Visual variant for the button. */
  variant?: "primary" | "secondary";
  /** Button label. */
  children: React.ReactNode;
}

const CAL_EMBED_SCRIPT_SRC = "https://app.cal.com/embed/embed.js";
const CAL_SCRIPT_ID = "nimi-cal-embed";

export function CalBookingButton({
  username,
  eventSlug,
  variant = "primary",
  children,
}: CalBookingButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setError(null);
    if (!username) {
      setError(
        "Online consultation booking isn't configured yet. Please use the enquiry form below.",
      );
      return;
    }
    if (typeof window === "undefined" || !window.Cal) {
      setError("Booking widget is still loading — please try again in a moment.");
      return;
    }

    setPending(true);
    try {
      // Cal.com's modal API. The script is loaded once below via <Script>,
      // which exposes window.Cal globally.
      window.Cal("init", { origin: "https://cal.com" });
      window.Cal("modal", {
        calLink: `${username}/${eventSlug}`,
        config: {
          theme: "light",
          // Surfaces a clean Nimi accent inside Cal.com's UI.
          cssVarsPerTheme: {
            light: { "cal-brand": "#5C1F18" },
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open the booking widget.");
    } finally {
      // The modal is owned by Cal.com from here; clear the local spinner.
      setPending(false);
    }
  };

  return (
    <>
      <Script
        id={CAL_SCRIPT_ID}
        src={CAL_EMBED_SCRIPT_SRC}
        strategy="lazyOnload"
      />
      <div>
        <Button type="button" variant={variant} size="md" onClick={open} disabled={pending}>
          {pending ? "Opening…" : children}
        </Button>
        {error ? (
          <p
            role="alert"
            className="mt-3 max-w-sm font-sans text-sm text-semantic-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}
