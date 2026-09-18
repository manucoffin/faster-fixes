import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

export const markupIoFaqs: FaqItem[] = [
  {
    question: "Is there a free Markup.io alternative?",
    answer:
      "Yes. FasterFixes is free to self-host with no member limits, and the hosted Pro plan is $20 a month flat for up to 5 members. The dashboard is AGPL-3.0 and the widget is MIT.",
  },
  {
    question: "Why did Markup.io raise its prices?",
    answer:
      "In January 2025 Markup.io raised Pro from $29 to $79 per month — a 172% increase — and removed the free plan entirely. Customers reported price changes of up to 280% on existing accounts and deletion notices for non-payment.",
  },
  {
    question: "Does FasterFixes work without a Chrome extension?",
    answer:
      "Yes. FasterFixes runs as an in-page widget on every device the page supports — desktop, tablet, mobile. No browser extension required, including for auth-gated, localhost, and staging URLs.",
  },
  {
    question: "Can I self-host a Markup.io alternative?",
    answer:
      "Yes. FasterFixes is the only open-source option in this category. Deploy the AGPL-3.0 dashboard and MIT widget on Vercel, Railway, a VPS, or any infrastructure you control. All feedback data stays inside your environment.",
  },
  {
    question:
      "Does FasterFixes work with AI coding agents like Claude Code or Cursor?",
    answer:
      "Yes. FasterFixes ships with a built-in MCP server. Claude Code, Cursor, and Codex can read open feedback, ask follow-up questions, and propose patches without you ever opening the dashboard.",
  },
  {
    question: "How does FasterFixes compare to Markup.io for web agencies?",
    answer:
      "Markup.io is positioned for design review across file types. FasterFixes is built for agencies shipping React or Next.js apps where feedback needs to reach a developer or AI agent — component tree capture, structured sync to GitHub, Linear, and Jira, in-page widget on every device.",
  },
];

export function MarkupIoFaqSection() {
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
            {markupIoFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-lg md:text-xl">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-lg text-muted-foreground md:text-xl">
                    {faq.answer}
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
