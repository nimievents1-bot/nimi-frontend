/**
 * Anonymous-visitor pastry cart, persisted in localStorage.
 *
 * Why this exists:
 *   The operator wants visitors to add items to a cart without an
 *   account — only at the moment of checkout do we ask them to sign
 *   in. The server cart is auth-bound (JWT-guarded `/pastry-cart`),
 *   so for the anonymous half of the journey we keep a parallel
 *   client-side cart in localStorage. The cart page and the header
 *   indicator both read from this when the visitor isn't signed in,
 *   and on sign-in we POST the contents to the server's bulk-add
 *   endpoint so the two halves of the journey stitch together
 *   without the customer losing what they picked.
 *
 * Storage shape:
 *   - One JSON object keyed by `STORAGE_KEY`.
 *   - Versioned so we can ship a future migration if the line shape
 *     changes — we just bump the key suffix and the old value is
 *     ignored (and quietly garbage-collected on next clear).
 *
 * Snapshotting:
 *   - Each line carries a denormalised snapshot of the pastry
 *     (name, image, price, etc.) so the cart page can render
 *     immediately on a cold load without an extra server fetch.
 *   - When the cart page boots, it cross-checks each line against
 *     the public pastries feed and flips an `available` flag for
 *     anything that's been pulled, so stale items show a clear
 *     remove prompt instead of silently failing at checkout.
 *
 * Update signal:
 *   - We emit `nimi:cart:updated` on every mutation so the header
 *     cart indicator picks up the new count without a navigation,
 *     identical to the signal the authed path uses.
 *
 * Safety / SSR:
 *   - Every reader checks `typeof window` before touching
 *     localStorage so this module is safe to import from server
 *     components — it just no-ops during SSR.
 *   - Any read/write that throws (quota exceeded, private-mode
 *     restrictions, corrupted JSON) is swallowed and treated as an
 *     empty cart — the worst outcome is the customer adding the
 *     item again, never a runtime crash.
 */

const STORAGE_KEY = "nimi_guest_cart_v1";
const CART_UPDATED_EVENT = "nimi:cart:updated";

export interface GuestCartLine {
  pastryItemId: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  /** Unit price in minor units (pence). Snapshot from when the item was added. */
  unitPriceMinor: number;
  /** ISO-4217 currency code, lowercase to match the API convention. */
  currency: string;
  quantity: number;
}

function safeRead(): GuestCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Filter out any line that doesn't carry the minimum fields we
    // need. Defensive — guards against a manually-poked localStorage
    // value or a stale version we couldn't migrate.
    return parsed.filter(
      (l): l is GuestCartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as GuestCartLine).pastryItemId === "string" &&
        typeof (l as GuestCartLine).quantity === "number" &&
        (l as GuestCartLine).quantity > 0,
    );
  } catch {
    return [];
  }
}

function safeWrite(lines: GuestCartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    if (lines.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    }
  } catch {
    // Quota exceeded, private-mode, etc. We can't do much about it
    // here; the next read will return an empty cart and the user
    // sees the same item appear if they try to add it again.
  }
}

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

/** Read the current cart. SSR-safe (returns []). */
export function readGuestCart(): GuestCartLine[] {
  return safeRead();
}

/** Total quantity across all lines — drives the header badge count. */
export function readGuestCartCount(): number {
  return readGuestCart().reduce((n, l) => n + l.quantity, 0);
}

/** Subtotal in minor units across all lines — for the cart summary. */
export function readGuestCartSubtotalMinor(): number {
  return readGuestCart().reduce(
    (n, l) => n + l.quantity * l.unitPriceMinor,
    0,
  );
}

/**
 * Add an item to the cart. If a line with the same `pastryItemId`
 * exists, increment its quantity (matching the server behaviour). The
 * snapshot is refreshed on every add so a slightly stale localStorage
 * value gets corrected if the underlying pastry's name/price has
 * changed in the time since the customer first added it.
 */
export function addToGuestCart(
  line: Omit<GuestCartLine, "quantity">,
  quantity: number = 1,
): void {
  if (quantity <= 0) return;
  const lines = safeRead();
  const existing = lines.find((l) => l.pastryItemId === line.pastryItemId);
  if (existing) {
    existing.quantity += quantity;
    existing.name = line.name;
    existing.slug = line.slug;
    existing.description = line.description;
    existing.imageUrl = line.imageUrl;
    existing.unitPriceMinor = line.unitPriceMinor;
    existing.currency = line.currency;
  } else {
    lines.push({ ...line, quantity });
  }
  safeWrite(lines);
  emit();
}

/** Set the absolute quantity of a line. Removes the line at qty <= 0. */
export function setGuestCartQuantity(
  pastryItemId: string,
  quantity: number,
): void {
  const lines = safeRead();
  const idx = lines.findIndex((l) => l.pastryItemId === pastryItemId);
  if (idx === -1) return;
  if (quantity <= 0) {
    lines.splice(idx, 1);
  } else {
    lines[idx]!.quantity = quantity;
  }
  safeWrite(lines);
  emit();
}

/** Drop a line entirely. No-op if the item isn't in the cart. */
export function removeFromGuestCart(pastryItemId: string): void {
  const lines = safeRead().filter((l) => l.pastryItemId !== pastryItemId);
  safeWrite(lines);
  emit();
}

/** Empty the cart. Used after a successful sync into the user's account. */
export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op; same swallow rationale as safeWrite.
  }
  emit();
}

export const GUEST_CART_UPDATED_EVENT = CART_UPDATED_EVENT;
