import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { SectionHeading } from "../../_components/section-heading";

export const actionableBugReportsFaqs: FaqItem[] = [
  {
    question: "What does a good bug report contain?",
    answer:
      "The page URL, the exact element, the browser and operating system, a screenshot, the console logs and network requests, and a way to see what happened before the bug. Faster Fixes attaches all of it automatically, along with a replay of the last minute on the page.",
  },
  {
    question:
      "Do clients need an account or a browser extension to report a bug?",
    answer:
      "No. They open the site through a review link, click the element that looks wrong, write one sentence and submit.",
  },
  {
    question: "Are regular visitors of my site recorded?",
    answer:
      "No. The widget only appears for people who open the site through a review link. Regular visitors never see it and are never recorded.",
  },
  {
    question: "Does the session replay capture what clients type?",
    answer:
      "No. The content of form fields is never recorded: the replay shows where the client typed, not what. You can also mask or block any element on the page.",
  },
  {
    question: "Can bug reports go to GitHub, Linear or Jira?",
    answer:
      "Yes. Each report can become an issue in GitHub, Linear or Jira with its screenshot, logs and a link to the replay. Coding agents can also read reports through the MCP server.",
  },
  {
    question: "Is Faster Fixes free, and is it open source?",
    answer:
      "The Free plan has no time limit and includes the full capture and the MCP server. Faster Fixes is open source, so you can also self-host it.",
  },
];

export function ActionableBugReportsFaq() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeading className="lg:sticky lg:top-24 lg:self-start">
          Frequently asked questions
        </SectionHeading>

        <Accordion type="single" collapsible className="border-t">
          {actionableBugReportsFaqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="py-5 text-lg md:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
