import { socialAccounts, type SocialAccount } from "@/lib/social";
import { cn } from "@/lib/cn";

/**
 * Compact icon-only row of brand social links.
 *
 * Visual:
 *   - Each icon is a 22×22 monochrome SVG, currentColor — so the
 *     parent text class colours it. Hover lifts to orange-700 on
 *     light surfaces or orange-300 on dark.
 *   - Anchors are 40×40 to give comfortable tap targets on phones.
 *   - All links carry `target="_blank" rel="noopener noreferrer"`
 *     because they leave the site to a third-party domain.
 *
 * Accessibility:
 *   - Each anchor has an explicit aria-label ("Open Nimi Events on
 *     Instagram"). The SVGs are aria-hidden — the label is the
 *     spoken affordance.
 *
 * Variants:
 *   - `tone="light"` for cream/maroon surfaces (default).
 *   - `tone="dark"` for the dark hero strip if ever needed.
 */
interface Props {
  /** Surface tone the icons sit on. Picks the right hover colour. */
  tone?: "light" | "dark";
  /** Extra classes for the wrapping nav (margins / alignment). */
  className?: string;
  /** Show the handle text beside each icon. Defaults to icon-only. */
  withLabels?: boolean;
}

export function SocialLinks({
  tone = "light",
  className,
  withLabels = false,
}: Props) {
  const linkColour =
    tone === "dark"
      ? "text-cream-50 hover:text-orange-300"
      : "text-maroon-700 hover:text-orange-700";

  return (
    <nav
      aria-label="Nimi Events on social media"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {socialAccounts.map((account) => (
        <a
          key={account.name}
          href={account.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open Nimi Events on ${account.name}`}
          className={cn(
            "inline-flex items-center gap-2",
            withLabels ? "px-2 py-2" : "h-10 w-10 justify-center",
            "transition-colors duration-fast ease-brand",
            linkColour,
          )}
        >
          <SocialIcon account={account} />
          {withLabels ? (
            <span className="font-sans text-sm">{account.handle}</span>
          ) : null}
        </a>
      ))}
    </nav>
  );
}

/**
 * Inline monochrome icon dispatcher. Paths are hand-tuned outline
 * versions — the brand prefers slim strokes over filled glyphs.
 */
function SocialIcon({ account }: { account: SocialAccount }) {
  switch (account.name) {
    case "Instagram":
      return (
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "TikTok":
      return (
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/*
            Stylised TikTok glyph — quaver-and-head silhouette.
            Drawn in outline to match the brand's editorial weight
            rather than the platform's filled official mark.
          */}
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 4c0 2.7 2 4.5 4.5 4.5" />
        </svg>
      );
  }
}
