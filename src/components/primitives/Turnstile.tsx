"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";

interface TurnstileProps {
  /** Called with the token on success. Called with empty string on expiry/error. */
  onToken: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile widget — client-only, brand-themed.
 * If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not configured (typical in dev),
 * we no-op and immediately emit a placeholder token so the form can submit.
 * The API mirrors this: in dev with no secret, server-side verification
 * is skipped. In production both must be set.
 */
export function Turnstile({ onToken }: TurnstileProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const siteKey = clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const render = useCallback(() => {
    if (!siteKey || !window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onToken,
      "error-callback": () => onToken(""),
      "expired-callback": () => onToken(""),
      theme: "light",
    });
  }, [onToken, siteKey]);

  useEffect(() => {
    if (!siteKey) {
      // No site key configured — emit a placeholder so dev forms work.
      onToken("dev-mode-no-turnstile");
      return;
    }
    if (scriptReady) render();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey, render, onToken]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div id={id} ref={containerRef} className="my-3" />
    </>
  );
}
