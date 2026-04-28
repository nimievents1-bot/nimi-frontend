import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface HeroProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  /** Optional CSS background-image url — when not set, a brand gradient is used. */
  imageUrl?: string;
  /** Children rendered below the lede (CTAs, scroll indicator, etc.). */
  children?: ReactNode;
  /** Hero height variants. Default tall (homepage); short for section landings. */
  height?: "tall" | "short";
  className?: string;
}

/**
 * Hero — full-bleed photography with a darken-gradient overlay.
 * Headline is display serif, lede is italic display.
 *
 * Replace the gradient placeholder with real photography by passing imageUrl.
 * Always keep the gradient overlay so headline contrast holds AA at every focal length.
 */
export function Hero({
  eyebrow,
  title,
  lede,
  imageUrl,
  children,
  height = "tall",
  className,
}: HeroProps) {
  const overlay =
    "linear-gradient(180deg, rgba(31,8,5,0.55) 0%, rgba(31,8,5,0.15) 40%, rgba(31,8,5,0.65) 100%)";
  const fallback =
    "radial-gradient(circle at 70% 60%, #E48039, #481810)";

  const backgroundImage = imageUrl
    ? `${overlay}, url("${imageUrl}")`
    : `${overlay}, ${fallback}`;

  return (
    <section
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        "px-page-gutter py-20 text-center text-cream-50",
        height === "tall" ? "min-h-[540px]" : "min-h-[340px]",
        className,
      )}
      style={{ backgroundImage, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {eyebrow ? (
        <span className="mb-3 font-sans text-eyebrow font-semibold uppercase tracking-[0.28em] text-orange-200">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="m-0 max-w-[18ch] font-display text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1.08] text-cream-50">
        {title}
      </h1>
      {lede ? (
        <p className="mt-4 max-w-[56ch] font-display text-xl italic text-cream-100/95">{lede}</p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
      {height === "tall" ? (
        <span
          aria-hidden
          className="absolute bottom-4 left-1/2 h-1.5 w-14 -translate-x-1/2 rounded-pill bg-cream-50/60"
        />
      ) : null}
    </section>
  );
}
