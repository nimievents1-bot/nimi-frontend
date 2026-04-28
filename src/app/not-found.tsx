import Link from "next/link";

import { Footer } from "@/components/patterns/Footer";
import { Header } from "@/components/patterns/Header";
import { Button } from "@/components/primitives/Button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-180px)] items-center justify-center bg-cream-50 px-page-gutter">
        <div className="max-w-prose text-center">
          <p className="eyebrow mb-3">404</p>
          <h1 className="m-0 mb-4 font-display text-5xl font-medium text-maroon-600">
            That page isn’t on the menu.
          </h1>
          <p className="mb-8 font-sans text-base text-neutral-700">
            The link may be old, or the page may have moved. Try the homepage or get in touch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/">
              <Button>Back to home</Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary">Get in touch</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
