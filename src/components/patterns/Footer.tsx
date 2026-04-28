import Link from "next/link";

import { NewsletterForm } from "./NewsletterForm";

const services = [
  { label: "Catering", href: "/catering" },
  { label: "Event planning", href: "/events" },
  { label: "Event coordination", href: "/events#coordination" },
  { label: "Gifting", href: "/gifting" },
  { label: "Pastry Cravings", href: "/cravings" },
];

const help = [
  { label: "About Nimi", href: "/about" },
  { label: "Frequently asked", href: "/faq" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms & conditions", href: "/terms" },
  { label: "Get in touch", href: "/contact" },
];

/**
 * Footer — cream surface, four columns. Newsletter form is wired
 * to the API via NewsletterForm (a client component).
 */
export function Footer() {
  return (
    <footer className="border-t border-cream-200 bg-cream-100 px-page-gutter py-12 md:py-16">
      <div className="mx-auto grid max-w-page grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <h5 className="mb-4 font-display text-3xl font-medium text-maroon-600">
            About Nimi Events
          </h5>
          <p className="mb-4 font-sans text-base text-neutral-700">
            Catering, planning and gifting for the moments that matter.
            Family kitchen, hospitality standard.
          </p>
          <p className="mb-1 font-sans text-base text-neutral-700">020 0000 0000</p>
          <Link
            href="mailto:hello@nimievents.co.uk"
            className="font-sans text-base text-orange-600 underline underline-offset-4 hover:text-orange-700"
          >
            hello@nimievents.co.uk
          </Link>

          <NewsletterForm />
        </div>

        <FooterCol heading="Services" items={services} />
        <FooterCol heading="Help & Info" items={help} />

        <div>
          <h5 className="mb-3 font-display text-2xl font-medium text-maroon-600">Our standards</h5>
          <p className="mb-3 font-sans text-base text-neutral-700">Food Hygiene Rating · 5</p>
          <span className="inline-flex items-center gap-2 rounded-md bg-[#7BB73C] px-3 py-2 font-sans text-sm font-extrabold tracking-wide text-[#1A2D0E]">
            ★★★★★ Very good
          </span>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-page flex-wrap items-center justify-between gap-3 border-t border-cream-200 pt-6">
        <span className="font-sans text-xs text-neutral-500">
          © Nimi Events {new Date().getFullYear()} · All rights reserved.
        </span>
        <span className="font-sans text-xs text-neutral-500">
          <Link href="/privacy" className="text-orange-600 underline underline-offset-4">
            Privacy
          </Link>
          {" · "}
          <Link href="/cookies" className="text-orange-600 underline underline-offset-4">
            Cookies
          </Link>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  items,
}: {
  heading: string;
  items: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h5 className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.26em] text-maroon-700">
        {heading}
      </h5>
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <li key={item.href} className="py-1.5">
            <Link
              href={item.href}
              className="font-sans text-base text-neutral-700 hover:text-orange-600"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
