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
import { COMPETITOR_PRICES } from "../../../_helpers/competitor-prices";
import { formatPrice } from "../../../_helpers/format-competitor-price";

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];
const ruttlPro = formatPrice(COMPETITOR_PRICES.ruttl.plans.pro);

export const ruttlFaqs: FaqItem[] = [
  {
    question: "Does Ruttl have a free plan?",
    answer: `Yes. The Basic plan is free for up to 5 users with 1 project, 5 pages, and 1 GB of storage. Paid plans start at ${ruttlPro} per user per month.`,
  },
  {
    question: "Does Ruttl require a Chrome extension?",
    answer:
      "Yes for sites behind Basic Authentication. The extension requirement removes mobile feedback from the workflow on those projects: clients cannot annotate from a phone.",
  },
  {
    question:
      "Which Ruttl alternative is cheapest for teams larger than three people?",
    answer: `FasterFixes. The hosted Pro plan is $${proPrice} a month flat for up to ${proPlan.seats} members. Self-hosting is free. Ruttl Pro at ${ruttlPro} per user per month scales linearly with team size.`,
  },
  {
    question: "Can FasterFixes replace Ruttl for client feedback?",
    answer:
      "Yes. Client guests annotate directly on the page with no account required. Comments, screenshots, and metadata are captured the same way Ruttl handles them.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "It exposes your feedback queue as a Model Context Protocol server. Claude Code, Cursor, and Codex can read open feedback, ask follow-up questions, and propose patches without you opening the dashboard.",
  },
  {
    question: "Is FasterFixes really open source?",
    answer:
      "Yes. The dashboard is AGPL-3.0 and the widget is MIT. Both are available on GitHub at github.com/manucoffin/faster-fixes.",
  },
  {
    question: "Is there a free open-source alternative to Ruttl?",
    answer:
      "FasterFixes is the only open-source option in this category. Self-hosting is free and supported on Vercel, Railway, or any infrastructure you control.",
  },
];

export function RuttlFaqSection() {
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
            {ruttlFaqs.map((faq) => (
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
