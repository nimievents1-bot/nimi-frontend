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
        "page-gutter": "24px",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};

export default config;
