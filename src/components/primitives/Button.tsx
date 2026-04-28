import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Button — primary interactive element across the marketing surface.
 *
 * The italic-serif treatment is the brand's signature CTA voice.
 * Primary = maroon-filled. Secondary = soft cream. Ghost = orange-outlined.
 * Use <ButtonLink> from `./ButtonLink.tsx` (when added) for `<a>` semantics.
 *
 * Variants intentionally have square edges (no rounded corners) — that's a
 * brand decision documented in the design system file.
 */
const buttonStyles = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-display italic font-medium",
    "transition-colors duration-base ease-brand",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-orange-500",
  ],
  {
    variants: {
      variant: {
        primary: "bg-maroon-600 text-cream-50 hover:bg-maroon-700 disabled:hover:bg-maroon-600",
        secondary:
          "border border-cream-200 bg-cream-100 text-maroon-700 hover:border-orange-200 hover:bg-orange-100",
        ghost:
          "border border-orange-500 bg-transparent text-orange-700 hover:bg-orange-50 hover:text-orange-800",
      },
      size: {
        sm: "px-5 py-2.5 text-base",
        md: "px-7 py-3 text-lg",
        lg: "px-9 py-4 text-xl",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonStyles>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...rest}
    />
  );
});
