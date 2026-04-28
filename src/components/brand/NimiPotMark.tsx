import { type SVGProps } from "react";

/**
 * The Nimi Events pot mark — inline SVG logo.
 * Colours sampled directly from the brand logo.
 *
 * Use the <Wordmark> component below for the full lockup; this is just the mark.
 */
interface NimiPotMarkProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export function NimiPotMark({ title = "Nimi Events", ...rest }: NimiPotMarkProps) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{title}</title>
      {/* smoke */}
      <path
        d="M52 14c-3 4 0 7 2 10s2 6-2 10"
        fill="none"
        stroke="#5C1F18"
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <path
        d="M44 16c-2 3 0 6 2 8"
        fill="none"
        stroke="#5C1F18"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* lid */}
      <ellipse cx={50} cy={42} rx={32} ry={6} fill="#5C1F18" />
      <rect x={46} y={34} width={8} height={6} rx={2} fill="#5C1F18" />
      {/* body */}
      <path
        d="M22 44 h56 l-4 30 a10 10 0 0 1 -10 8 h-28 a10 10 0 0 1 -10 -8 z"
        fill="#D9602B"
      />
      {/* handles */}
      <ellipse cx={20} cy={56} rx={3.5} ry={5} fill="#D9602B" />
      <ellipse cx={80} cy={56} rx={3.5} ry={5} fill="#D9602B" />
      {/* slits */}
      <g fill="#5C1F18">
        {[33, 38, 43, 48, 53, 58, 63].map((x) => (
          <rect key={x} x={x} y={58} width={2} height={6} rx={1} />
        ))}
      </g>
    </svg>
  );
}

interface WordmarkProps {
  /** Show the secondary tagline beneath the wordmark. Default false. */
  withTag?: boolean;
  /** Render in light tone (over dark photography). Default false. */
  onDark?: boolean;
  className?: string;
}

export function Wordmark({ withTag = false, onDark = false, className }: WordmarkProps) {
  const nameColor = onDark ? "text-cream-50" : "text-maroon-600";
  const tagColor = onDark ? "text-cream-200" : "text-neutral-500";
  return (
    <a
      href="/"
      aria-label="Nimi Events — home"
      className={["flex items-center gap-3", className].filter(Boolean).join(" ")}
    >
      <NimiPotMark className="h-11 w-11 flex-none" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[1.45rem] font-medium uppercase tracking-[0.16em] ${nameColor}`}
        >
          Nimi Events
        </span>
        {withTag ? (
          <span
            className={`mt-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] ${tagColor}`}
          >
            Catering · Events · Gifting
          </span>
        ) : null}
      </span>
    </a>
  );
}
