import { cn } from "@/lib/cn";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqProps {
  items: FaqItem[];
  className?: string;
}

/**
 * FAQ accordion — uses the native <details> / <summary> elements for
 * accessibility (keyboard, screen readers) without extra JS.
 *
 * The +/− indicator is orange-600 to keep interaction colour consistent.
 */
export function Faq({ items, className }: FaqProps) {
  return (
    <div className={cn("border-t border-cream-200", className)}>
      {items.map((item) => (
        <details
          key={item.question}
          className="group border-b border-cream-200 py-5 marker:hidden [&_summary::-webkit-details-marker]:hidden"
        >
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-medium text-maroon-600"
          >
            {item.question}
            <span
              aria-hidden
              className="text-2xl font-light text-orange-600 transition-transform duration-base group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 max-w-prose font-sans text-base leading-relaxed text-neutral-700">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
