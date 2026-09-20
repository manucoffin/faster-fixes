import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type RichFaqItem = FaqItem & { content?: ReactNode };

type DocLinkProps = {
  href: Route;
  children: ReactNode;
};

function DocLink({ href, children }: DocLinkProps) {
  return (
    <Link
      href={href}
      className="text-foreground underline underline-offset-4 hover:no-underline"
    >
      {children}
    </Link>
  );
}

export const slackFaqs: RichFaqItem[] = [
  {
    question:
      "Does Faster Fixes post a new Slack message for every status update?",
    answer:
      "No. The original message is edited in place as the feedback status changes: new, in progress, resolved, closed. The channel keeps one message per piece of feedback instead of a stream of status-change alerts.",
  },
  {
    question: "What information is included in each Slack notification?",
    answer:
      "The reviewer name, page URL, comment, screenshot, a current status badge, and an Open in Faster Fixes link. The full diagnostic trail stays in the dashboard behind that link: DOM selector, browser info, console logs, network requests.",
  },
  {
    question: "Can I send different projects to different Slack channels?",
    answer:
      "Yes. Each project links to its own channel, chosen in project settings. Feedback from separate client projects stays in separate channels rather than a single shared stream.",
  },
  {
    question: "Does the Slack integration create tasks or issues?",
    answer:
      "No. Slack is a one-way notification channel: it announces feedback and updates the status badge. For two-way issue tracking, use the GitHub or Linear integrations, which create issues and sync status both ways.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        No. Slack is a one-way notification channel: it announces feedback and
        updates the status badge. For two-way issue tracking, use the{" "}
        <DocLink href={"/docs/integrations/github" as Route}>GitHub</DocLink> or{" "}
        <DocLink href={"/docs/integrations/linear" as Route}>Linear</DocLink>{" "}
        integrations, which create issues and sync status both ways.
      </p>
    ),
  },
  {
    question: "What happens when an AI agent resolves feedback?",
    answer:
      "The Slack message updates to a 🤖 Resolved by agent badge, so the team can tell automated resolutions from ones a person closed. This happens when a coding agent resolves feedback through the Faster Fixes MCP server.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        The Slack message updates to a 🤖 Resolved by agent badge, so the team
        can tell automated resolutions from ones a person closed. This happens
        when a coding agent resolves feedback through the Faster Fixes{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink>.
      </p>
    ),
  },
  {
    question: "Do my clients need a Slack account?",
    answer:
      "No. Clients submit feedback through the widget on your site. Only your internal team needs Slack. The notifications go to your workspace, not theirs.",
  },
];

export function SlackFaqSection() {
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
            {slackFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-lg md:text-xl">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.content ?? (
                    <p className="text-lg text-muted-foreground md:text-xl">
                      {faq.answer}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
