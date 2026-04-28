import Link from "next/link";

import { cn } from "@/lib/cn";

interface CardProps {
  eyebrow?: string;
  title: string;
  description: string;
  /** Hex / gradient background for the media area; replace with real image. */
  mediaStyle?: React.CSSProperties;
  /** Tier highlight — top maroon stripe for Platinum cards. */
  flagship?: boolean;
  children?: React.ReactNode;
  href?: string;
  className?: string;
}

/**
 * Card — used for service tiles, package tiers, gift collections, blog teasers.
 * Square edges by brand decision; rounded-pill is reserved for tags only.
 */
export function Card({
  eyebrow,
  title,
  description,
  mediaStyle,
  flagship = false,
  children,
  href,
  className,
}: CardProps) {
  const Inner = (
    <article
      className={cn(
        "flex flex-col bg-cream-50 transition-all duration-base ease-brand",
        "border border-cream-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md",
        flagship && "border-t-4 border-t-maroon-600",
        className,
      )}
    >
      <div
        aria-hidden
        className="aspect-[4/3] w-full bg-gradient-to-br from-orange-300 to-maroon-500"
        style={mediaStyle}
      />
      <div className="p-6 pb-8">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h3 className="m-0 mb-2 font-display text-2xl font-medium leading-tight text-maroon-600">
          {title}
        </h3>
        <p className="m-0 mb-4 font-sans text-base text-neutral-700">{description}</p>
        {children}
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="no-underline">
      {Inner}
    </Link>
  ) : (
    Inner
  );
}
