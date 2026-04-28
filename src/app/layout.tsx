import "./globals.css";

import { type Metadata, type Viewport } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";

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
    default: "Nimi Events — Catering, Event Planning, Gifting",
    template: "%s · Nimi Events",
  },
  description:
    "Nimi Events — catering, event planning, gifting and the Pastry Cravings monthly subscription. Where good food gathers.",
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
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
