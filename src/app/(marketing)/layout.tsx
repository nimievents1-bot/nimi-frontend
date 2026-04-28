import { Footer } from "@/components/patterns/Footer";
import { Header } from "@/components/patterns/Header";

/**
 * Marketing layout — used for inner public pages (catering, events, gifting,
 * about, faq, etc.). Wraps content with the cream-toned header and the footer.
 *
 * The homepage doesn't use this layout because it overlays the header on a
 * dark hero photograph; see `src/app/page.tsx` for that variant.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="bg-cream-50">{children}</main>
      <Footer />
    </>
  );
}
