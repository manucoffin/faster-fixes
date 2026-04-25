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

export const bugherdFaqs: RichFaqItem[] = [
  {
    question: "Is FasterFixes really free?",
    answer:
      "Yes. The dashboard is open source under AGPL-3.0 and the widget under MIT — clone the repo and self-host for free. The hosted Free plan is also permanently free (one project, up to 50 feedback items, one team member). Paid hosted plans are $20/month for Pro and $99/month for Agency.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The dashboard is open source under AGPL-3.0 and the widget under
        MIT — clone the repo and self-host for free. See the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        . The hosted Free plan is also permanently free (one project, up to 50
        feedback items, one team member). Paid hosted plans are $20/month for
        Pro and $99/month for Agency.
      </p>
    ),
  },
  {
    question: "How is FasterFixes different from BugHerd?",
    answer:
      "Three differences matter most. FasterFixes is open source and self-hostable. Pricing is flat-rate, not per-seat. And the MCP server lets AI coding agents (Claude Code, Cursor, Codex) fetch and resolve feedback directly from the terminal. BugHerd is a more mature SaaS with video feedback, Figma/PDF/image feedback, custom branding, SSO, and 20+ project-management integrations — features FasterFixes does not currently have.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Three differences matter most. FasterFixes is open source and
        self-hostable. Pricing is flat-rate, not per-seat. And the{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> lets AI
        coding agents (Claude Code, Cursor, Codex) fetch and resolve feedback
        directly from the terminal. BugHerd is a more mature SaaS with video
        feedback, Figma/PDF/image feedback, custom branding, SSO, and 20+
        project-management integrations — features FasterFixes does not
        currently have.
      </p>
    ),
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Deploy on your own infrastructure and run it without a FasterFixes hosted account. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Deploy on your own infrastructure and run it without a
        FasterFixes hosted account. The dashboard is AGPL-3.0; the widget
        packages are MIT. Full instructions in the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "Does FasterFixes have a kanban board?",
    answer:
      "Yes. The team dashboard includes a drag-and-drop kanban view. What FasterFixes does not have today is a client-facing task board (BugHerd's Premium plan does). It is on the roadmap.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to any MCP-compatible coding agent. Your agent can list unresolved feedback, read the full technical context for each item (URL, DOM selector, React component path, browser, viewport), apply a fix, and mark the item resolved — all from the terminal, without leaving the editor.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        @fasterfixes/mcp exposes your open feedback to any MCP-compatible coding
        agent. Your agent can list unresolved feedback, read the full technical
        context for each item (URL, DOM selector, React component path, browser,
        viewport), apply a fix, and mark the item resolved — all from the
        terminal, without leaving the editor. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
      </p>
    ),
  },
  {
    question: "How do I install the widget in a Next.js or React app?",
    answer:
      "Run npm install @fasterfixes/react, mount the FeedbackWidget component in your layout, and pass the project key. Works with the Next.js App Router and any React-based framework. More framework adapters are on the way.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Run npm install @fasterfixes/react, mount the FeedbackWidget component
        in your layout, and pass the project key. Works with the Next.js App
        Router and any React-based framework. See the{" "}
        <DocLink href={"/docs/widget/react" as Route}>
          React widget docs
        </DocLink>{" "}
        and{" "}
        <DocLink href={"/docs/getting-started/quickstart" as Route}>
          quickstart
        </DocLink>
        . More framework adapters are on the way.
      </p>
    ),
  },
  {
    question: "Does FasterFixes work on non-React websites?",
    answer:
      "Not today. The widget is a framework-native React component — first-class on React and Next.js, and adapters for other frameworks are on the roadmap. We chose framework-native over a generic JS tag because it gives the widget access to the React component tree and lets us render inside your app rather than in a sandboxed overlay. If you need a feedback widget on a non-JavaScript stack today, BugHerd's JS tag or Chrome extension is a better fit.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Not today. The widget is a framework-native React component —
        first-class on React and Next.js, and adapters for other frameworks
        are on the roadmap. We chose framework-native over a generic JS tag
        because it gives the widget access to the React component tree and
        lets us render inside your app rather than in a sandboxed overlay. If
        you need a feedback widget on a non-JavaScript stack today,
        BugHerd&apos;s JS tag or Chrome extension is a better fit. See the{" "}
        <DocLink href={"/docs/widget/other-frameworks" as Route}>
          other frameworks page
        </DocLink>{" "}
        for the latest status.
      </p>
    ),
  },
  {
    question: "Can I use Claude, GPT, or any other model with FasterFixes?",
    answer:
      "Yes. The MCP server is model-agnostic. Pick the agent you already use — Claude Code, Cursor, Codex, or any other MCP-compatible client — and the agent runs whichever model you have configured. BugHerd AI, by contrast, is bundled into the BugHerd dashboard and does not let you bring your own model.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> is
        model-agnostic. Pick the agent you already use — Claude Code, Cursor,
        Codex, or any other MCP-compatible client — and the agent runs
        whichever model you have configured. BugHerd AI, by contrast, is
        bundled into the BugHerd dashboard and does not let you bring your own
        model.
      </p>
    ),
  },
  {
    question: "How do I move my BugHerd data over?",
    answer:
      "BugHerd supports CSV, XML, and JSON exports from all plans. Today the migration is manual — use the export as a reference to recreate active items in FasterFixes. A create_feedback tool is on the MCP roadmap so your AI agent will be able to read the export and backfill the dashboard for you.",
  },
  {
    question: "Does FasterFixes integrate with GitHub like BugHerd does?",
    answer:
      "Yes. The GitHub integration creates an issue from each feedback item with the full structured report — screenshot, component path, selector, environment — and syncs status both ways. Closing an issue on GitHub resolves the feedback in FasterFixes, and vice versa.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The GitHub integration creates an issue from each feedback item
        with the full structured report — screenshot, component path, selector,
        environment — and syncs status both ways. Closing an issue on GitHub
        resolves the feedback in FasterFixes, and vice versa. See the{" "}
        <DocLink href={"/docs/integrations/github" as Route}>
          GitHub integration docs
        </DocLink>
        .
      </p>
    ),
  },
];

export function BugherdFaqSection() {
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
            {bugherdFaqs.map((faq) => (
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
