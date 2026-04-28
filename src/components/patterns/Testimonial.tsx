import { cn } from "@/lib/cn";

interface TestimonialProps {
  quote: string;
  attribution: string;
  className?: string;
}

/**
 * Testimonial — italic-serif pull quote on cream with a warm-orange left rule.
 * Use sparingly; one per section is plenty.
 */
export function Testimonial({ quote, attribution, className }: TestimonialProps) {
  return (
    <figure
      className={cn(
        "border-l-4 border-orange-500 bg-cream-100 px-10 py-10",
        "max-w-page",
        className,
      )}
    >
      <blockquote className="m-0 max-w-[60ch] font-display text-2xl italic leading-snug text-neutral-800">
        “{quote}”
      </blockquote>
      <figcaption className="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-maroon-700">
        {attribution}
      </figcaption>
    </figure>
  );
}
