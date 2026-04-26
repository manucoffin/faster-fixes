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

export const markerIoFaqs: RichFaqItem[] = [
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
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Marker.io has no self-hosted option. Deploy on your own infrastructure and run FasterFixes without a hosted account. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Marker.io has no self-hosted option. Deploy on your own
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
    question: "How is FasterFixes different from Marker.io?",
    answer:
      "FasterFixes is open-source and self-hostable; Marker.io is closed-source and cloud-only. FasterFixes ships an MCP server so AI coding agents (Claude Code, Cursor, Codex) can fetch and resolve feedback from the terminal. Marker.io has no MCP support. Marker.io has the broader feature set today — session replay, Figma/PDF annotation, deep PM integrations, and a client Guest Portal — features FasterFixes does not currently match.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        FasterFixes is open-source and self-hostable; Marker.io is closed-source
        and cloud-only. FasterFixes ships an{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> so AI
        coding agents (Claude Code, Cursor, Codex) can fetch and resolve
        feedback from the terminal. Marker.io has no MCP support. Marker.io has
        the broader feature set today — session replay, Figma/PDF annotation,
        deep PM integrations, and a client Guest Portal — features FasterFixes
        does not currently match.
      </p>
    ),
  },
  {
    question: "Does FasterFixes have a kanban board?",
    answer:
      "Yes. The team dashboard includes a drag-and-drop kanban view. What FasterFixes does not have today is a client-facing board — Marker.io's Guest Portal covers that. The team kanban is available on every plan, including the free tier.",
  },
  {
    question: "What does the MCP integration do?",
    answer:
      "@fasterfixes/mcp exposes your open feedback to any MCP-compatible coding agent. Your agent can list unresolved feedback, read the full technical context (URL, DOM selector, React component path, browser, viewport), apply a fix, and mark the item resolved — all from the terminal. Marker.io has no equivalent.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        @fasterfixes/mcp exposes your open feedback to any MCP-compatible
        coding agent. Your agent can list unresolved feedback, read the full
        technical context (URL, DOM selector, React component path, browser,
        viewport), apply a fix, and mark the item resolved — all from the
        terminal. Marker.io has no equivalent. See{" "}
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
      "Not today. The widget is a framework-native React component — first-class on React and Next.js, with adapters for other frameworks on the roadmap. If you need a feedback widget on a non-JavaScript stack today, Marker.io's JS snippet, browser extension, or WordPress plugin is a better fit.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Not today. The widget is a framework-native React component —
        first-class on React and Next.js, with adapters for other frameworks on
        the roadmap. If you need a feedback widget on a non-JavaScript stack
        today, Marker.io&apos;s JS snippet, browser extension, or WordPress
        plugin is a better fit. See the{" "}
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
      "Yes. The MCP server is model-agnostic. Pick the agent you already use — Claude Code, Cursor, Codex, or any other MCP-compatible client — and the agent runs whichever model you have configured. Marker.io's AI features are bundled inside the dashboard and do not let you bring your own model.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP server</DocLink> is
        model-agnostic. Pick the agent you already use — Claude Code, Cursor,
        Codex, or any other MCP-compatible client — and the agent runs
        whichever model you have configured. Marker.io&apos;s AI features
        (Title Generation, Magic Rewrite, Translation) are bundled inside the
        dashboard and do not let you bring your own model.
      </p>
    ),
  },
  {
    question: "How do I move my Marker.io data over?",
    answer:
      "Export your existing feedback as CSV from the Marker.io dashboard, set up a FasterFixes workspace (hosted or self-hosted), install the React widget in your project, and reconnect your GitHub integration. Today the migration is manual — a create_feedback MCP tool is on the roadmap so your AI agent will be able to read the export and backfill the dashboard for you.",
  },
  {
    question:
      "How does the FasterFixes GitHub integration compare to Marker.io's Jira-heavy stack?",
    answer:
      "FasterFixes ships two-way GitHub Issues sync on every paid plan, included by default. Marker.io supports GitHub but is more deeply integrated with Jira — and Jira sync is gated behind the Team plan at $149/month annual. If your team works primarily in GitHub, FasterFixes is a more direct fit. If Jira is central to your workflow, Marker.io's Team plan is the better option today.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        FasterFixes ships two-way GitHub Issues sync on every paid plan,
        included by default. Marker.io supports GitHub but is more deeply
        integrated with Jira — and Jira sync is gated behind the Team plan at
        $149/month annual. If your team works primarily in GitHub, FasterFixes
        is a more direct fit. If Jira is central to your workflow,
        Marker.io&apos;s Team plan is the better option today. See the{" "}
        <DocLink href={"/docs/integrations/github" as Route}>
          GitHub integration docs
        </DocLink>
        .
      </p>
    ),
  },
];

export function MarkerIoFaqSection() {
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
            {markerIoFaqs.map((faq) => (
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
