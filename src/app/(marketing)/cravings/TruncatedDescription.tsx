"use client";

import { useState } from "react";

interface Props {
  /** Full descriptive text written by the admin. */
  text: string;
  /**
   * Approximate character budget shown before truncation. We round
   * down to the previous word boundary so we never cut mid-word.
   * Default 50 — fits roughly one line at our mobile body size and
   * lands a 6-to-8-word teaser ("Halal flavorful chicken, sausage,
   * fresh…") which is what the operator asked for: title leads,
   * description is just a hint until the customer taps the ellipsis.
   */
  charBudget?: number;
}

/**
 * Compact, tap-to-expand description for pastry cards on mobile.
 *
 * UX brief from the operator: the description was crowding out the
 * item name on phones; she wants the title to lead and only a teaser
 * of the description visible by default, with a single "…" the
 * customer can tap to read the rest. We render the teaser inline
 * with the ellipsis, and a "show less" link once expanded so the
 * card can collapse back without disappearing off-screen.
 *
 * Implementation choices:
 *   - Pure client state, no animation library. The card sizes are
 *     small enough that a layout snap on expand feels fine; an
 *     animated max-height would add JS for no real polish win.
 *   - Truncation is done in plain JS (not CSS line-clamp) because
 *     we need the ellipsis to be a real interactive element, not a
 *     visual stand-in. CSS line-clamp can't carry a click handler.
 *   - We never call useState for descriptions that are shorter than
 *     the budget — they're rendered as plain text so the markup
 *     stays lean and we don't ship a useless toggle.
 */
export function TruncatedDescription({ text, charBudget = 50 }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Short enough already — render plainly. Don't ship a toggle that
  // would only ever no-op.
  if (text.length <= charBudget) {
    return (
      <p className="m-0 mt-1 font-sans text-sm leading-relaxed text-neutral-700">
        {text}
      </p>
    );
  }

  // Find the latest word boundary at or before the budget so we
  // don't slice mid-word. If the first word is longer than the
  // budget (rare; would only happen with unusual product names),
  // fall back to a hard cut at the budget.
  const sliced = text.slice(0, charBudget);
  const lastSpace = sliced.lastIndexOf(" ");
  const teaser = (lastSpace > Math.max(20, charBudget * 0.4)
    ? sliced.slice(0, lastSpace)
    : sliced
  ).trimEnd();

  if (expanded) {
    return (
      <p className="m-0 mt-1 font-sans text-sm leading-relaxed text-neutral-700">
        {text}{" "}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="font-display italic text-orange-700 underline underline-offset-4 transition-colors hover:text-orange-800"
          aria-label="Show less"
        >
          show less
        </button>
      </p>
    );
  }

  return (
    <p className="m-0 mt-1 font-sans text-sm leading-relaxed text-neutral-700">
      {teaser}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        // The ellipsis itself is the affordance — tactile, generous
        // hit area, and styled in the brand orange so it reads as
        // "tap me" without needing an extra "read more" label.
        className="ml-0.5 inline-flex items-baseline font-display italic text-orange-700 underline underline-offset-4 transition-colors hover:text-orange-800"
        aria-label="Read full description"
      >
        …
      </button>
    </p>
  );
}
