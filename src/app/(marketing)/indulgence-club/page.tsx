import { permanentRedirect } from "next/navigation";

/**
 * `/indulgence-club` — brand-aligned alias for the existing `/cravings` page.
 *
 * The canonical route remains `/cravings` because:
 *   - The API endpoints live under `/cravings/*` and renaming them would
 *     require a coordinated client/server deploy with no benefit.
 *   - Existing emails, account links, and the Stripe success URL all point
 *     at `/cravings` — keeping it stable preserves those.
 *
 * This file only exists so URLs typed or shared as `/indulgence-club` resolve
 * cleanly. `permanentRedirect` (308) preserves any query string and method,
 * which `redirect()` doesn't on POSTs (relevant if a form ever targets this
 * path by mistake).
 */
export default function IndulgenceClubAlias() {
  permanentRedirect("/cravings");
}
