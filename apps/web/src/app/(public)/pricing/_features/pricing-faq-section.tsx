import { GITHUB_REPO_URL } from "@/app/_constants/app";
import type { FaqItem } from "@/app/_features/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import type * as React from "react";

export const pricingFaqs: FaqItem[] = [
  {
    question: "Is there really a free plan?",
    answer:
      "Yes. The Free plan includes 1 project with up to 50 feedback items and is not time-limited. It is designed for solo developers or anyone who wants to try FasterFixes on a real project before committing to a paid plan.",
  },
  {
    question: "Can I upgrade or downgrade at any time?",
    answer:
      "Yes. You can upgrade directly from your dashboard. Downgrades take effect at the end of your current billing period, so you keep access to your current plan until then.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "You keep full access to your plan until the end of the current billing period. After that, your account moves to the Free plan. Your data is never deleted.",
  },
  {
    question: "Do you offer annual billing?",
    answer:
      "Yes. Annual billing saves you two months compared to paying monthly — effectively 10 months for the price of 12.",
  },
  {
    question: "Is FasterFixes open source? Can I self-host?",
    answer: `Yes. The full source code is available on GitHub (${GITHUB_REPO_URL}). You can self-host if you prefer to run it on your own infrastructure. The hosted version saves you the setup and maintenance overhead, and includes managed updates and support.`,
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We use Stripe for billing. You can pay with any major credit or debit card. All payments are processed securely through Stripe — we never store your card details.",
  },
  {
    question: "Do I need a paid plan for the MCP server or GitHub integration?",
    answer:
      "The MCP server works on all plans, including Free. The GitHub integration — which automatically creates issues from feedback — requires a Pro or Agency plan.",
  },
  {
    question: "What counts as a feedback item?",
    answer:
      "Each time a client submits feedback through the widget, it counts as one feedback item. The Free plan includes up to 50. Pro and Agency plans have unlimited feedback.",
  },
  {
    question: "How does team member pricing work?",
    answer:
      "There are no per-seat charges. Each plan includes a set number of team members — 1 on Free, 5 on Pro, unlimited on Agency. You only pay the flat plan price.",
  },
];

function linkifyAnswer(text: string): React.ReactNode {
  if (!text.includes(GITHUB_REPO_URL)) return text;

  const parts = text.split(GITHUB_REPO_URL);
  return (
    <>
      {parts[0]}
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline underline-offset-4"
      >
        {GITHUB_REPO_URL}
      </a>
      {parts[1]}
    </>
  );
}

export function PricingFaqSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <Accordion type="single" collapsible>
            {pricingFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-lg md:text-xl">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground text-lg md:text-xl">
                    {linkifyAnswer(faq.answer)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
