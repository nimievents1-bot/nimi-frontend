/**
 * Nimi Events — Design System tokens.
 *
 * Source of truth for the brand. Sampled from the Nimi Events logo:
 *   - warm orange (pot body)        → primary
 *   - deep maroon (lid / wordmark)  → accent
 *   - cream                         → page surface (never pure white)
 *
 * The Tailwind config in `/tailwind.config.ts` derives its theme from here.
 * Components use the resulting Tailwind classes (bg-orange-500, etc.).
 *
 * If you change a value here, it propagates to Tailwind on next build.
 * Match the values to the design system HTML file ("Nimi-Events-Design-System.html").
 */

export const tokens = {
  colors: {
    /** Warm orange — primary, sampled from the pot body. */
    orange: {
      50: "#FDF4EE",
      100: "#FAE3D1",
      200: "#F4C29C",
      300: "#ECA068",
      400: "#E48039",
      500: "#D9602B",
      600: "#B84B22",
      700: "#92381A",
      800: "#6E2914",
      900: "#4A1A0D",
    },
    /** Deep maroon — accent, sampled from the wordmark, lid and smoke. */
    maroon: {
      50: "#FAEFEC",
      100: "#F0CFC7",
      200: "#DDA092",
      300: "#C5715D",
      400: "#A24632",
      500: "#6B2A1F",
      600: "#5C1F18",
      700: "#481810",
      800: "#321009",
      900: "#1F0805",
    },
    /** Page surface — never pure white. */
    cream: {
      50: "#FBF7EB",
      100: "#F4EDDA",
      200: "#E6DBC1",
    },
    /** Warm neutrals — body text, dividers, secondary surfaces. */
    neutral: {
      300: "#CCBFA8",
      400: "#A89779",
      500: "#7A6A52",
      600: "#534736",
      700: "#3A3225",
      800: "#2C2620",
      900: "#191512",
    },
    /** Reserved for system feedback, never marketing accents. */
    semantic: {
      success: "#2E7D5B",
      warning: "#C68A2A",
      danger: "#B23A2A",
      info: "#2D5C7E",
    },
  },

  typography: {
    /** Display serif — headings, hero, italic CTAs, pull-quotes. */
    display: ['"Cormorant Garamond"', "Georgia", "serif"],
    /** Humanist sans — navigation, body, labels, captions, UI. */
    sans: ["Mulish", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    /** Type scale; line-heights paired conservatively for editorial feel. */
    scale: {
      "2xs": ["0.6875rem", { lineHeight: "1.3" }], // 11px
      eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.28em" }], // 12px
      xs: ["0.8125rem", { lineHeight: "1.5" }], // 13px
      sm: ["0.9375rem", { lineHeight: "1.6" }], // 15px
      base: ["1rem", { lineHeight: "1.7" }], // 16px
      lg: ["1.125rem", { lineHeight: "1.6" }], // 18px
      xl: ["1.375rem", { lineHeight: "1.5" }], // 22px
      "2xl": ["1.625rem", { lineHeight: "1.4" }], // 26px
      "3xl": ["2rem", { lineHeight: "1.2" }], // 32px
      "4xl": ["2.75rem", { lineHeight: "1.15" }], // 44px
      "5xl": ["3.75rem", { lineHeight: "1.08" }], // 60px
      "6xl": ["5rem", { lineHeight: "1.05" }], // 80px
    },
    tracking: {
      tighter: "-0.02em",
      tight: "-0.005em",
      normal: "0",
      wide: "0.04em",
      wider: "0.16em",
      widest: "0.28em",
    },
  },

  radii: {
    none: "0",
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "10px",
    xl: "16px",
    pill: "9999px",
  },

  shadows: {
    /** Warm, maroon-tinted shadows — never grey. */
    sm: "0 1px 2px rgba(50, 16, 9, 0.05)",
    md: "0 6px 18px rgba(50, 16, 9, 0.08)",
    lg: "0 18px 40px rgba(50, 16, 9, 0.12)",
  },

  motion: {
    easing: "cubic-bezier(.2,.7,.3,1)",
    duration: {
      fast: "120ms",
      base: "220ms",
      slow: "380ms",
    },
  },
} as const;

export type Tokens = typeof tokens;
