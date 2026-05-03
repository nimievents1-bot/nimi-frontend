import { cn } from "@/lib/cn";

interface TestimonialProps {
  quote: string;
  attribution: string;
  /** Optional 1–5 rating. Renders as filled vs empty stars above the quote. */
  rating?: number;
  className?: string;
}

/**
 * Testimonial — italic-serif pull quote on cream with a warm-orange left rule.
 * Use as a single feature quote, or render multiple inside a grid (the
 * `Testimonials` server component on the homepage does the latter).
 */
export function Testimonial({ quote, attribution, rating, className }: TestimonialProps) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col border-l-4 border-orange-500 bg-cream-100 px-8 py-8 md:px-10 md:py-10",
        "max-w-page",
        className,
      )}
    >
      {typeof rating === "number" && rating > 0 ? (
        <div
          aria-label={`${Math.min(rating, 5)} out of 5 stars`}
          className="mb-3 font-sans text-base text-orange-600"
        >
          {Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join(" ")}
        </div>
      ) : null}
      <blockquote className="m-0 max-w-[60ch] flex-1 font-display text-xl italic leading-snug text-neutral-800 md:text-2xl">
        “{quote}”
      </blockquote>
      <figcaption className="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-maroon-700">
        {attribution}
      </figcaption>
    </figure>
  );
}
