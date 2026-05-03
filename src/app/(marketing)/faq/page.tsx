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
          "Larger events: three to six months' notice. Smaller events: a maximum of three months. Rush windows depend on the calendar.",
      },
      {
        question: "Where are you based and do you travel?",
        answer:
          "We're based in Bradford / Leeds and cater across the UK. Travel is available with additional charges, agreed at quote stage.",
      },
      {
        question: "How does the booking process work?",
        answer:
          "Submit an enquiry or book a paid consultation. We respond within one working day, send a concept and quote after the consultation, then confirm with a deposit when you're ready to proceed.",
      },
    ],
  },
  {
    heading: "Gifting",
    items: [
      {
        question: "How long does a gift box take to make?",
        answer:
          "Production time is six to twelve weeks depending on complexity. All items are custom and made to order, so early booking is strongly recommended.",
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
    heading: "The Nimi Indulgence Club",
    items: [
      {
        question: "How does the credit system work?",
        answer:
          "Set a monthly amount; it becomes Indulgence Credits each month, valid for two to three months from issue. Use credits on pastry orders any time within their validity period. Minimum order on pastry orders is £25.",
      },
      {
        question: "What's the minimum commitment?",
        answer:
          "Three months. After that the subscription continues until you cancel from your account; cancellation stops future billing but does not refund credits already issued.",
      },
      {
        question: "Are credits refundable?",
        answer:
          "No. Credits are prepaid value, not cashback or cash equivalent. Surprises and bonus drops are occasional perks, not guaranteed value. Priority access to limited drops is the main value driver.",
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
