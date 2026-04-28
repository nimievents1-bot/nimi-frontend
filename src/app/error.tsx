"use client";

import { useEffect } from "react";

import { Button } from "@/components/primitives/Button";

/**
 * Global error boundary for the App Router. Logs to Sentry (when configured)
 * and gives the user a clear path forward. Stays brand-styled even when
 * everything else has gone wrong.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Render error:", error);
    // TODO: Sentry.captureException(error) once SDK is wired up.
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-cream-50 px-page-gutter">
        <div className="max-w-prose text-center">
          <p className="eyebrow mb-3">Something broke</p>
          <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
            We hit an unexpected snag.
          </h1>
          <p className="mb-8 font-sans text-base text-neutral-700">
            Our team has been notified. You can try again, or head back to the kitchen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>
              Back to home
            </Button>
          </div>
          {error.digest ? (
            <p className="mt-6 font-sans text-xs text-neutral-500">Reference: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
