import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

export const gleapFaqs: FaqItem[] = [
  {
    question: "What is the best Gleap alternative?",
    answer: `For bug reporting, FasterFixes: it is the only Gleap alternative you can self-host for $0, and the hosted Pro plan is $${proPrice}/mo flat for up to ${proPlan.seats} members. Every Feedback carries the DOM selector, React component tree, console logs, and network requests, readable by Claude Code and Cursor over MCP. If you need live chat or mobile SDKs, Gleap remains the better fit.`,
  },
  {
    question: "Is FasterFixes a free Gleap alternative?",
    answer: `Yes. Free to self-host with no member limits. Hosted Pro plan is $${proPrice}/mo flat for up to ${proPlan.seats} members.`,
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. AGPL-3.0 dashboard, MIT widget. Deploy on any infrastructure you control. Gleap is cloud-only.",
  },
  {
    question: "Does FasterFixes have mobile SDKs?",
    answer:
      "No. FasterFixes is web only: a script tag for any website, plus packages for React, Vue, Angular, and Svelte. No iOS, Android, Flutter, or React Native SDKs.",
  },
  {
    question: "How does FasterFixes integrate with Claude Code and Cursor?",
    answer:
      "Via a built-in MCP server. Query your feedback queue directly from your terminal or IDE, no browser needed.",
  },
  {
    question: "Does FasterFixes support customer support or live chat?",
    answer:
      "No. No chatbot, no ticketing, no shared inbox. It is a bug reporting tool, not a support platform.",
  },
  {
    question: "Why did Gleap pivot to customer support?",
    answer:
      "Gleap expanded to compete in the larger customer support market, adding Kai AI, ticketing, and multichannel messaging to position alongside Intercom and Zendesk.",
  },
];

export function GleapFaqSection() {
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
            {gleapFaqs.map((faq) => (
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
