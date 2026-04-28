import Link from "next/link";

import { cn } from "@/lib/cn";

interface StampProps {
  href?: string;
  /** Two short lines, italic serif. Defaults to "Get in / Touch". */
  line1?: string;
  line2?: string;
  /** Render in inverted tone (cream on maroon vs maroon on cream). */
  onDark?: boolean;
  className?: string;
}

/**
 * Stamp — the persistent italic-serif corner CTA inspired by Mel's Meals
 * "Get in Touch" badge. Brand signature; do not restyle.
 */
export function Stamp({
  href = "/contact",
  line1 = "Get in",
  line2 = "Touch",
  onDark = false,
  className,
}: StampProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex flex-col items-start font-display italic leading-[1.05] no-underline",
        "px-[18px] py-[14px] text-[1.1rem]",
        "transition-colors duration-base ease-brand",
        onDark
          ? "bg-cream-50 text-maroon-700 hover:bg-cream-100"
          : "bg-maroon-700 text-cream-50 hover:bg-maroon-800",
        className,
      )}
    >
      <span>{line1}</span>
      <span>{line2}</span>
    </Link>
  );
}
