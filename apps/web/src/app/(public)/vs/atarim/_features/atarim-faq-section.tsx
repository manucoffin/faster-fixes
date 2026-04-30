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

export const atarimFaqs: RichFaqItem[] = [
  {
    question: "Is FasterFixes free?",
    answer:
      "Yes. The Free plan includes 1 project, 50 feedback items, and 1 member — no credit card required. Self-hosting is free forever with no item or member limits beyond your own infrastructure. The Pro plan is $20/month flat for up to 5 members, and the Agency plan is $99/month for unlimited members.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The Free plan includes 1 project, 50 feedback items, and 1 member
        — no credit card required. Self-hosting is free forever with no item
        or member limits beyond your own infrastructure. The Pro plan is
        $20/month flat for up to 5 members, and the Agency plan is $99/month
        for unlimited members. See the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "Can I self-host FasterFixes?",
    answer:
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Atarim has no self-hosted option. Deploy on Vercel, Railway, or any Node-compatible host. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Atarim has no self-hosted option. Deploy on Vercel, Railway,
        or any Node-compatible host. The dashboard is AGPL-3.0; the widget
        packages are MIT. Full instructions in the{" "}
        <DocLink href={"/docs/self-hosting" as Route}>
          self-hosting guide
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "How is FasterFixes different from Atarim?",
    answer:
      "FasterFixes is open-source (AGPL-3.0 + MIT) and self-hostable; Atarim is proprietary and cloud-only. FasterFixes charges a flat monthly rate; Atarim charges per seat ($25/seat/month on Pro). FasterFixes ships a React/Next.js npm widget that captures component tree, DOM selector, and full browser context; Atarim uses a JS snippet, Chrome extension, or WordPress plugin with no React SDK and no component tree capture. FasterFixes includes an MCP server for AI coding agents; Atarim has no MCP integration.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        FasterFixes is open-source (AGPL-3.0 + MIT) and self-hostable; Atarim
        is proprietary and cloud-only. FasterFixes charges a flat monthly
        rate; Atarim charges per seat ($25/seat/month on Pro). FasterFixes
        ships a React/Next.js npm widget that captures component tree, DOM
        selector, and full browser context. FasterFixes also includes an MCP
        server for AI coding agents; Atarim has no MCP integration.
      </p>
    ),
  },
  {
    question: "Does FasterFixes have video recording?",
    answer:
      "No. FasterFixes does not currently support video recording or session replay. It captures a screenshot, React component tree, DOM selector, URL, browser, and viewport on each feedback item. Atarim does not offer video recording either; if video walkthroughs are a hard requirement, BugHerd or Userback include video features.",
  },
  {
    question: "Does Atarim support whitelabeling?",
    answer:
      "Yes, on the Enterprise plan (custom pricing). Atarim's whitelabel options include custom logo, favicon, color scheme, plugin name, and removal of all Atarim branding. This is one of Atarim's genuine strengths for agencies on Enterprise that deliver a branded client experience. FasterFixes does not currently offer whitelabeling.",
  },
  {
    question: "What does the MCP server do?",
    answer:
      "@fasterfixes/mcp is a Model Context Protocol server that connects Claude Code, Cursor, and Codex to your FasterFixes workspace. Feedback items are accessible directly in the terminal — no browser tab switching, no copy-pasting issue descriptions into a chat window. Atarim does not have an MCP integration: its InnerCircle AI agents run only inside the Atarim dashboard.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        @fasterfixes/mcp is a Model Context Protocol server that connects
        Claude Code, Cursor, and Codex to your FasterFixes workspace.
        Feedback items are accessible directly in the terminal. Atarim does
        not have an MCP integration: its InnerCircle AI agents run only
        inside the Atarim dashboard. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and
        the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
      </p>
    ),
  },
  {
    question: "How do I install FasterFixes in Next.js?",
    answer:
      "Run npm install @fasterfixes/react, mount the FeedbackWidget component in your layout, and pass the project key. The widget hooks into your React tree and captures the component path on every report. Works with the Next.js App Router and any React-based framework.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Run npm install @fasterfixes/react, mount the FeedbackWidget
        component in your layout, and pass the project key. The widget hooks
        into your React tree and captures the component path on every
        report. Works with the Next.js App Router and any React-based
        framework. See the{" "}
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
      "Partially. FasterFixes has a basic HTML embed for non-React pages. The full context capture — React component tree, DOM selector — is only available with the React widget. Atarim's JS snippet, Chrome extension, and WordPress plugin work on any stack. If your project is WordPress, plain HTML, or a non-React framework, Atarim has broader compatibility today.",
    content: (
      <p className="text-muted-foreground text-lg md:text-xl">
        Partially. FasterFixes has a basic HTML embed for non-React pages.
        The full context capture — React component tree, DOM selector — is
        only available with the React widget. Atarim&apos;s JS snippet,
        Chrome extension, and WordPress plugin work on any stack. See the{" "}
        <DocLink href={"/docs/widget/other-frameworks" as Route}>
          other frameworks page
        </DocLink>{" "}
        for the latest status.
      </p>
    ),
  },
  {
    question: "How do I migrate from Atarim?",
    answer:
      "Four steps: export open tasks from Atarim via CSV or your connected PM tool, deploy FasterFixes (self-hosted or hosted Pro), replace the Atarim JS snippet (or WordPress plugin) with @fasterfixes/react, then invite your team and connect GitHub for two-way sync. The full guide is in the migration section above.",
  },
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The FasterFixes dashboard is licensed under AGPL-3.0 and the widget under MIT. The source code is publicly available on GitHub. You can inspect it, self-host it, and contribute to it. Atarim is proprietary and closed-source.",
  },
];

export function AtarimFaqSection() {
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
            {atarimFaqs.map((faq) => (
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
