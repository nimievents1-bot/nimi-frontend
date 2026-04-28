import type { Config } from "tailwindcss";

import { tokens } from "./src/lib/design-system/tokens";

/**
 * Tailwind config — derived from the Nimi Events design system tokens.
 * The single source of truth for tokens is `src/lib/design-system/tokens.ts`.
 * This file just adapts those values into Tailwind theme extensions.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: {
        display: tokens.typography.display,
        sans: tokens.typography.sans,
      },
      fontSize: tokens.typography.scale,
      letterSpacing: tokens.typography.tracking,
      borderRadius: tokens.radii,
      boxShadow: tokens.shadows,
      transitionTimingFunction: {
        brand: tokens.motion.easing,
      },
      transitionDuration: tokens.motion.duration,
      maxWidth: {
        prose: "70ch",
        page: "1240px",
      },
      spacing: {
        // Both consume CSS variables defined in globals.css → automatically
        // mobile-aware. `px-page-gutter` and `py-section-y` propagate the
        // responsive change site-wide without per-page edits.
        "page-gutter": "var(--page-gutter)",
        "section-y": "var(--section-y)",
      },
      minHeight: {
        "hero-tall": "var(--hero-min-h-tall)",
        "hero-short": "var(--hero-min-h-short)",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};

export default config;
