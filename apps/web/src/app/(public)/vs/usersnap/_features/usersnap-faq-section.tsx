import type { FaqItem } from "@/app/_features/seo/faq-schema";
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

export const usersnapFaqs: RichFaqItem[] = [
  {
    question: "Is FasterFixes free to use?",
    answer:
      "Yes. The hosted Free plan is permanent — 1 project, 50 feedback items, 1 member, no time limit, no credit card. The dashboard is open source under AGPL-3.0 and the widget is MIT, so self-hosting is also free regardless of team size. Paid hosted plans are $20/month for Pro and $99/month for Agency.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The hosted Free plan is permanent — 1 project, 50 feedback items,
        1 member, no time limit, no credit card. The dashboard is open source
        under AGPL-3.0 and the widget is MIT, so{" "}
        <DocLink href={"/docs/self-hosting" as Route}>self-hosting</DocLink> is
        also free regardless of team size. Paid hosted plans are $20/month for
        Pro and $99/month for Agency.
      </p>
    ),
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Usersnap has no self-hosted option. Deploy on your own infrastructure and run FasterFixes without a hosted account. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Usersnap has no self-hosted option. Deploy on your own
        infrastructure and run FasterFixes without a hosted account. The
        dashboard is AGPL-3.0; the widget packages are MIT. Full instructions
        in the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "How is FasterFixes different from Usersnap?",
    answer:
      "FasterFixes is open-source and self-hostable; Usersnap is closed-source and cloud-only. FasterFixes ships an MCP server so AI coding agents (Claude Code, Cursor, Codex) can fetch and resolve feedback from the terminal. Usersnap is a broader platform focused on NPS surveys, microsurveys, and feature request boards — features FasterFixes does not currently offer. FasterFixes is built specifically for developer teams who need structured bug reports, not product feedback surveys.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        FasterFixes is open-source and self-hostable; Usersnap is closed-source
        and cloud-only. FasterFixes ships an{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> so AI
        coding agents (Claude Code, Cursor, Codex) can fetch and resolve
        feedback from the terminal. Usersnap is a broader platform focused on
        NPS surveys, microsurveys, and feature request boards — features
        FasterFixes does not currently offer.
      </p>
    ),
  },
  {
    question: "Does FasterFixes support NPS surveys?",
    answer:
      "No. FasterFixes does not currently support NPS surveys, CSAT microsurveys, or feature request boards. If those workflows are central to your process, Usersnap is the better fit. FasterFixes is focused on visual bug reports and structured feedback for developer teams.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to any MCP-compatible coding agent. Your agent can list unresolved feedback, read the full technical context (URL, DOM selector, React component path, browser, viewport), apply a fix, and mark the item resolved — all from the terminal. Usersnap has no equivalent.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        @fasterfixes/mcp exposes your open feedback to any MCP-compatible
        coding agent. Your agent can list unresolved feedback, read the full
        technical context (URL, DOM selector, React component path, browser,
        viewport), apply a fix, and mark the item resolved — all from the
        terminal. Usersnap has no equivalent. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
      </p>
    ),
  },
  {
    question: "How do I install the widget in a Next.js or React app?",
    answer:
      "Run npm install @fasterfixes/react, mount the FeedbackWidget component in your layout, and pass the project key. The widget hooks into your React tree and captures the component path on every report. Works with the Next.js App Router and any React-based framework.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Run npm install @fasterfixes/react, mount the FeedbackWidget component
        in your layout, and pass the project key. The widget hooks into your
        React tree and captures the component path on every report. Works with
        the Next.js App Router and any React-based framework. See the{" "}
        <DocLink href={"/docs/widget/react" as Route}>
          React widget docs
        </DocLink>{" "}
        and the{" "}
        <DocLink href={"/docs/getting-started/quickstart" as Route}>
          quickstart
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "Does FasterFixes work on non-React stacks?",
    answer:
      "Partially. FasterFixes has a basic HTML embed for non-React pages. However, the full context capture — React component tree, DOM selector — is only available with the React widget. Usersnap's JS snippet and browser extension work on any stack. If your project is not React-based, Usersnap offers broader compatibility today.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Partially. FasterFixes has a basic HTML embed for non-React pages.
        However, the full context capture — React component tree, DOM selector
        — is only available with the React widget. Usersnap&apos;s JS snippet
        and browser extension work on any stack. See the{" "}
        <DocLink href={"/docs/widget/other-frameworks" as Route}>
          other frameworks page
        </DocLink>{" "}
        for the latest status.
      </p>
    ),
  },
  {
    question: "How do I migrate from Usersnap to FasterFixes?",
    answer:
      "Export your feedback data from Usersnap via CSV or API, then deploy FasterFixes (self-hosted or Pro). Replace the Usersnap widget with the FasterFixes React widget or HTML embed. Note that NPS and survey workflows do not migrate — FasterFixes does not support those features. Connect GitHub for two-way sync and configure @fasterfixes/mcp for your AI agent.",
  },
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The FasterFixes dashboard is licensed under AGPL-3.0 and the widget under MIT. The source code is publicly available. You can inspect it, self-host it, and contribute to it. Usersnap is proprietary and closed-source.",
  },
  {
    question: "What is the FasterFixes Agency plan?",
    answer:
      "The Agency plan costs $99/month and includes unlimited members, unlimited projects, MCP server access, GitHub two-way sync, team kanban, and email support. It is designed for agencies managing multiple client sites from a single workspace at a flat monthly rate.",
  },
];

export function UsersnapFaqSection() {
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
            {usersnapFaqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-lg md:text-xl">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.content ?? (
                    <p className="text-muted-foreground text-lg md:text-xl">
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
