import { type Metadata } from "next";

import { Hero } from "@/components/patterns/Hero";
import { images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How we use cookies on nimievents.co.uk.",
};

export default function CookiesPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Legal"
        title="Cookie policy."
        lede="What we use, why, and how to opt out."
        imageUrl={images.hero.cookies}
      />
      <section className="px-page-gutter section-tight">
        <article className="mx-auto max-w-prose font-sans text-base leading-relaxed text-neutral-800">
          <p className="font-display text-xl italic text-neutral-700">
            Last updated — placeholder. Final wording supplied by legal counsel before launch.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">Necessary</h2>
          <p>
            We use small cookies to keep you signed in and to protect against forgery. These are
            essential and can&rsquo;t be opted out.
          </p>
          <h2 className="mt-10 font-display text-3xl font-medium text-maroon-600">Analytics</h2>
          <p>
            We use privacy-respecting analytics (no cross-site tracking, no third-party ads). You
            can opt out via the cookie banner.
          </p>
        </article>
      </section>
    </>
  );
}
