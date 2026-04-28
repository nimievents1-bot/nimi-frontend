import { type Metadata } from "next";

import { Faq } from "@/components/patterns/Faq";
import { Hero } from "@/components/patterns/Hero";
import { images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Frequently asked",
  description: "Answers to the questions we hear most often — booking, gifting, subscriptions, dietary needs.",
};

const groups: ReadonlyArray<{
  heading: string;
  items: ReadonlyArray<{ question: string; answer: string }>;
}> = [
  {
    heading: "Booking and lead times",
    items: [
      {
        question: "How far in advance should I book?",
        answer:
          "For larger events we recommend six to twelve months. Smaller events can usually be served at a minimum of three months’ notice; rush windows depend on the calendar.",
      },
      {
        question: "Do you cater outside London?",
        answer:
          "Yes — UK-wide for events of all sizes. Travel and accommodation are budgeted at quote stage.",
      },
      {
        question: "How does the catering booking process work?",
        answer:
          "Submit an enquiry through the Catering page; we reply within one working day, schedule a consultation, agree on a menu, and confirm with a deposit.",
      },
    ],
  },
  {
    heading: "Gifting",
    items: [
      {
        question: "How long does a gift box take to make?",
        answer:
          "Six to ten weeks (approximately two to three months) depending on quantity and customisation level. Early booking is strongly recommended.",
      },
      {
        question: "Can I add my logo and colours?",
        answer:
          "Yes — every collection accepts logo upload (PNG/SVG up to 5 MB), names, dates, colour themes and personalised messages. We send a mock-up before production.",
      },
      {
        question: "Do you accept rush orders?",
        answer:
          "Rarely. Because every gift is custom-produced and sourced for your order, rush windows are tight and depend on the season.",
      },
    ],
  },
  {
    heading: "Pastry Cravings (subscription)",
    items: [
      {
        question: "How does the credit system work?",
        answer:
          "Pick a plan (£25, £50, £100 or custom) and that amount is added to your Cravings credit balance every month. Use it on pastry orders any time. Unused credit rolls over up to a £1,000 cap.",
      },
      {
        question: "Can I pause or cancel my subscription?",
        answer:
          "Yes. Pause for up to three months at a time from your account; cancel any time via the Stripe Customer Portal. Remaining credit stays for 12 months after cancellation.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Hero
        height="short"
        eyebrow="Help"
        title="Frequently asked questions."
        lede="The questions we hear most often, with the answers we tend to give."
        imageUrl={images.hero.faq}
      />
      <section className="px-page-gutter section-tight">
        <div className="mx-auto max-w-prose">
          {groups.map((group) => (
            <div key={group.heading} className="mb-12">
              <h2 className="m-0 mb-3 font-display text-3xl font-medium text-maroon-600">
                {group.heading}
              </h2>
              <Faq items={[...group.items]} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
