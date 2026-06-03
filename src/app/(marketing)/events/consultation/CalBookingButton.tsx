"use client";

import { useEffect, useState } from "react";

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
 *
 * ---
 *
 * Implementation note — Cal.com embed bootstrap:
 *
 * Cal.com's embed.js is NOT a self-contained script you can drop on a
 * page. Their embed pattern is two-stage:
 *
 *   1. A tiny "queue stub" is installed on `window.Cal` synchronously.
 *      All calls to `Cal(...)` push into the stub's queue.
 *   2. The stub lazily injects `app.cal.com/embed/embed.js` on first
 *      invocation; embed.js then replaces the stub and drains the
 *      queued commands.
 *
 * Loading `embed.js` directly (without the stub) makes embed.js throw
 * `Uncaught Error: Cal is not defined. This shouldn't happen` because
 * embed.js expects to find the stub already on `window.Cal` and attach
 * itself to it.
 *
 * The IIFE in `installCalBootstrap` below is the canonical Cal.com
 * embed snippet — same shape as the one their dashboard hands out for
 * vanilla HTML — adapted to TypeScript with explicit (narrow) typing
 * for the global. We install it once per mount via `useEffect`, which
 * is idempotent because the stub guards against re-installation.
 */

/** Variadic argument forwarded to Cal — strings, objects, etc. */
type CalArg = unknown;

/**
 * Public shape of `window.Cal`. The stub is a function we can invoke
 * with arbitrary positional arguments; embed.js then attaches several
 * internal fields once it loads. We mark all internal fields optional
 * so external code can't accidentally rely on them before embed.js
 * has finished bootstrapping.
 */
interface CalApi {
  (...args: CalArg[]): void;
  /** True once embed.js has been requested by the stub. */
  loaded?: boolean;
  /** Per-namespace child queues (we don't use namespaces here). */
  ns?: Record<string, CalApi>;
  /** The pending queue drained by embed.js after load. */
  q?: CalArg[][];
}

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

const CAL_EMBED_SCRIPT_SRC = "https://app.cal.com/embed/embed.js";

/**
 * Install the Cal.com embed queue stub on `window.Cal`. Mirrors the
 * official Cal.com embed snippet 1:1 — the IIFE shape is what their
 * embed.js detects when it loads, so deviating breaks the handshake.
 *
 * Safe to call multiple times: the inner `C.Cal = C.Cal || ...` keeps
 * the original stub when one already exists. The function also opts
 * out gracefully during SSR (window absent).
 */
function installCalBootstrap(): void {
  if (typeof window === "undefined") return;
  if (window.Cal) return;

  // Closure typed loosely on purpose: the IIFE body relies on
  // duck-typed property access (`a.q.push`, `cal.ns`, etc.) which
  // is hostile to strict TS narrowing. We confine the `any` to
  // this function and present a fully-typed `CalApi` to the rest
  // of the component.
  //
  // Lint suppression rationale (eslint @typescript-eslint/no-explicit-any):
  // the bootstrap is a verbatim copy of Cal.com's vendor snippet
  // and is intentionally untyped. Refactoring would diverge it
  // from Cal.com's contract and risk regressions on every SDK
  // update.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  (function (C: any, A: string, L: string): void {
    const p = function (a: any, ar: any): void {
      a.q.push(ar);
    };
    const d: Document = C.document;
    C.Cal =
      C.Cal ||
      function (this: any): void {
        const cal = C.Cal;
        // eslint-disable-next-line prefer-rest-params
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          (d.head.appendChild(d.createElement("script")) as HTMLScriptElement).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: any = function (this: any): void {
            // eslint-disable-next-line prefer-rest-params
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else {
            p(cal, ar);
          }
          return;
        }
        p(cal, ar);
      };
  })(window, CAL_EMBED_SCRIPT_SRC, "init");
  /* eslint-enable @typescript-eslint/no-explicit-any */
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

export function CalBookingButton({
  username,
  eventSlug,
  variant = "primary",
  children,
}: CalBookingButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Install the Cal.com bootstrap once on mount. The stub is what
  // every other interaction below relies on — it's also what makes
  // calling `Cal("init", …)` safe BEFORE embed.js has finished
  // loading, because the stub queues the call until embed.js drains
  // it.
  useEffect(() => {
    installCalBootstrap();
    // Kick the stub immediately so embed.js is requested as soon as
    // the page is interactive, rather than waiting for the user to
    // click. This is the canonical pattern; embed.js download is
    // ~30KB and runs only after IntersectionObserver fires on the
    // <html> tag, so it's cheap.
    window.Cal?.("init", { origin: "https://cal.com" });
  }, []);

  const open = () => {
    setError(null);
    if (!username) {
      setError(
        "Online consultation booking isn't configured yet. Please use the enquiry form below.",
      );
      return;
    }

    // The bootstrap ALWAYS sets `window.Cal` synchronously, so a
    // missing `Cal` here means useEffect hasn't run yet (extremely
    // narrow window after hydration). Falling back to a re-install
    // covers that race; the call below queues onto the stub and
    // executes as soon as embed.js loads.
    if (typeof window === "undefined") return;
    if (!window.Cal) installCalBootstrap();
    if (!window.Cal) {
      setError("Booking widget is still loading — please try again in a moment.");
      return;
    }

    setPending(true);
    try {
      // Re-init in case the embed loaded between mount and click.
      // Idempotent on Cal.com's side — they de-dupe init calls.
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
    <div>
      <Button type="button" variant={variant} size="md" onClick={open} disabled={pending}>
        {pending ? "Opening…" : children}
      </Button>
      {error ? (
        <p role="alert" className="mt-3 max-w-sm font-sans text-sm text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
