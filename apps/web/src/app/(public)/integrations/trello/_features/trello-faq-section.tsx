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

export const trelloFaqs: RichFaqItem[] = [
  {
    question: "How does the Trello status sync work?",
    answer:
      "When you link a board, you choose which list stands for new, in progress and resolved. Moving a card into one of those lists sets the feedback's status, and changing the status in Faster Fixes moves the card. A resolved card is also marked complete.",
  },
  {
    question: "What does a Trello card created from feedback contain?",
    answer:
      "The client's comment, the page URL, the CSS selector, the browser, viewport and reviewer, console logs and network requests, custom metadata, a link to the Recording when there is one, and a link to the feedback in the dashboard. The screenshot is attached and set as the card cover.",
  },
  {
    question: "Do my clients need a Trello account?",
    answer:
      "No. Clients leave feedback through the widget on your site. Only your team works in Trello, and the Recording link on a card requires a Faster Fixes login, so a card shared outside the team reveals nothing of the Recording.",
  },
  {
    question: "What happens to cards in lists I did not map?",
    answer:
      "Nothing. A card moved into an unmapped list, such as QA or Review, keeps the feedback's current status. Your intermediate steps never produce a wrong status.",
  },
  {
    question: "What happens if I archive a list or close the board?",
    answer:
      "Project settings warn you that the link needs attention, and card creation pauses for that project until you remap the lists, reopen the board or restore access. Cards never land in the wrong place.",
  },
  {
    question: "Is the Trello integration available on the free plan?",
    answer:
      "The Trello integration is included in every paid plan. If you downgrade, you can still unlink the board, and the existing cards stay on Trello.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        The Trello integration is included in every{" "}
        <DocLink href={"/pricing" as Route}>paid plan</DocLink>. If you
        downgrade, you can still unlink the board, and the existing cards stay
        on Trello.
      </p>
    ),
  },
  {
    question: "Can feedback go to Trello and Jira or Linear at the same time?",
    answer:
      "Yes. A project can mirror to Trello, GitHub, Linear and Jira at once, and status changes propagate to each of them independently, so every team follows the work in its own tool.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. A project can mirror to Trello,{" "}
        <DocLink href={"/integrations/github" as Route}>GitHub</DocLink>,{" "}
        <DocLink href={"/integrations/linear" as Route}>Linear</DocLink> and{" "}
        <DocLink href={"/integrations/jira" as Route}>Jira</DocLink> at once,
        and status changes propagate to each of them independently, so every
        team follows the work in its own tool.
      </p>
    ),
  },
];

export function TrelloFaqSection() {
  return (
    <section className="w-full border-t py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Trello integration FAQ
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <Accordion type="single" collapsible>
            {trelloFaqs.map((faq) => (
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
