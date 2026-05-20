"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { emitCartUpdated } from "@/components/patterns/CartIndicator";
import { apiFetch } from "@/lib/api";
import {
  clearGuestCart,
  readGuestCart,
} from "@/lib/guestCart";

/**
 * Side-effect component that runs once on the authed `/cart` page to
 * merge any leftover guest cart from localStorage into the server
 * cart. It mounts inside the server-rendered cart page, so by the
 * time React hydrates we already know the visitor is signed in.
 *
 * Flow:
 *   1. Read the localStorage guest cart on mount. If it's empty we
 *      no-op — the page already shows the authed server cart and
 *      there's nothing to sync.
 *   2. POST the lines to `/pastry-cart/items/bulk`. The server
 *      enforces availability and de-dupes line-by-line.
 *   3. Clear localStorage so a future browser refresh doesn't
 *      re-sync the same items.
 *   4. Emit the cart-updated event so the header badge refreshes,
 *      and call `router.refresh()` so the page's server-rendered
 *      cart re-fetches and re-renders with the merged contents.
 *
 * Idempotency:
 *   - We track a per-mount `ranRef` so React 18's StrictMode double
 *     effect doesn't double-sync in development.
 *   - The localStorage clear happens BEFORE the router.refresh so a
 *     navigation interruption can never leave the user in a state
 *     where the sync ran but the local copy still exists.
 *   - If the network POST fails, we leave localStorage intact so the
 *     customer can try again (e.g. by reloading) without losing
 *     their picks.
 */
export function GuestCartSync() {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const lines = readGuestCart();
    if (lines.length === 0) return;

    const payload = lines.map((l) => ({
      pastryItemId: l.pastryItemId,
      quantity: l.quantity,
    }));

    let cancelled = false;
    (async () => {
      try {
        await apiFetch("/pastry-cart/items/bulk", {
          method: "POST",
          body: { items: payload },
        });
        if (cancelled) return;
        clearGuestCart();
        emitCartUpdated();
        // Re-render the server component so the merged cart shows up.
        router.refresh();
      } catch {
        // Leave localStorage intact so the customer can retry by
        // reloading. We deliberately don't toast an error — the
        // page already shows their server cart (possibly empty),
        // and the guest items are still there for next time.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Side-effect only — no UI to render.
  return null;
}
