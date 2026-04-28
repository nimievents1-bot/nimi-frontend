import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TagProps {
  children: ReactNode;
  /** Default cream, or warmer variants. */
  variant?: "neutral" | "orange" | "maroon" | "success";
  className?: string;
}

/**
 * Pill-shaped tag for collection categories, lead-time chips and statuses.
 * The only place the brand uses rounded corners.
 */
export function Tag({ children, variant = "neutral", className }: TagProps) {
  const variantClass = {
    neutral: "bg-cream-100 text-maroon-700",
    orange: "bg-orange-100 text-orange-800",
    maroon: "bg-maroon-50 text-maroon-700",
    success: "bg-[#E5F2EC] text-semantic-success",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5",
        "font-sans text-2xs font-semibold uppercase tracking-wider",
        variantClass,
        className,
      )}
    >
      {children}
    </span>
  );
}
