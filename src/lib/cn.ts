import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classnames with conflict resolution.
 * Use everywhere instead of template-string concatenation
 * so later utility classes override earlier ones predictably.
 *
 * @example
 *   cn("px-4", condition && "px-6", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
