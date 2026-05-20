import "./globals.css";

import { type Metadata, type Viewport } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";

import { ConfirmProvider } from "@/components/patterns/ConfirmDialog";
import { clientEnv } from "@/lib/env";

/**
 * Brand typography pairing:
 *   - Cormorant Garamond (display): headings, hero, italic CTAs, pull-quotes
 *   - Mulish (sans): nav, body, form labels, captions, UI chrome
 *
 * Both loaded as Next.js optimised fonts so we self-host and avoid
 * a runtime call to Google's CDN. Variable refs are wired into
 * Tailwind's font families via globals.css and tailwind.config.ts.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7EB",
};

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_WEB_ORIGIN),
  title: {
    default: "Nimi Events — Authentically African Catering, Planning & Gifting",
    template: "%s · Nimi Events",
  },
  description:
    "Nimi Events — authentically African catering, event planning, gifting, content creation and The Nimi Indulgence Club. Authentically African flavours, considered planning, and gifts that arrive on time.",
  applicationName: "Nimi Events",
  keywords: [
    "catering",
    "event planning",
    "gifting",
    "pastry subscription",
    "afro-caribbean catering",
    "wedding catering",
  ],
  openGraph: {
    type: "website",
    siteName: "Nimi Events",
    locale: "en_GB",
    title: "Nimi Events — Catering, Event Planning, Gifting",
    description: "Where good food gathers.",
  },
  // Twitter card metadata — `creator`/`site` use a placeholder since
  // the brand isn't on X. The card itself still renders correctly
  // when an Instagram/TikTok link is shared on platforms that
  // respect Twitter card meta (Slack, Discord, iMessage previews).
  twitter: { card: "summary_large_image" },
  // Surfaces both social profiles to search engines and link-preview
  // tools (LinkedIn, etc.) as alternate brand identities — useful
  // for entity-graph reconciliation and "see also" suggestions.
  other: {
    "og:see_also": [
      "https://www.instagram.com/nimi_events",
      "https://www.tiktok.com/@nimi.events",
    ],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {/*
         * ConfirmProvider mounts a single shared modal dialog at the
         * root, so `useConfirm()` is callable from any component in any
         * route group (marketing, account, admin). Render position
         * matters only for portal containment — the provider does not
         * inject layout chrome.
         */}
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
