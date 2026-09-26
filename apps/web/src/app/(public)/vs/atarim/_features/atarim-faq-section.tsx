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

export const atarimFaqs: RichFaqItem[] = [
  {
    question: "Is FasterFixes free?",
    answer:
      "Yes. The Free plan includes 1 project, 50 feedback items, and 1 member, no credit card required. Self-hosting is free forever with no item or member limits beyond your own infrastructure. The Pro plan is $20/month flat for up to 5 members, and the Agency plan is $99/month for unlimited members.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The Free plan includes 1 project, 50 feedback items, and 1 member,
        no credit card required. Self-hosting is free forever with no item or
        member limits beyond your own infrastructure. The Pro plan is $20/month
        flat for up to 5 members, and the Agency plan is $99/month for unlimited
        members. See the{" "}
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
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Atarim has no self-hosted option. Deploy on Vercel, Railway, or
        any Node-compatible host. The dashboard is AGPL-3.0; the widget packages
        are MIT. Full instructions in the{" "}
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
      "FasterFixes is open-source (AGPL-3.0 + MIT) and self-hostable; Atarim is proprietary and cloud-only. FasterFixes charges a flat monthly rate; Atarim charges per seat ($25/seat/month on Pro). FasterFixes ships a widget that installs with a script tag on any site or as a React package, and captures DOM selector, full browser context, and the React component tree on React sites; Atarim uses a JS snippet, Chrome extension, or WordPress plugin with no React SDK and no component tree capture. FasterFixes includes an MCP server for AI coding agents; Atarim has no MCP integration.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        FasterFixes is open-source (AGPL-3.0 + MIT) and self-hostable; Atarim is
        proprietary and cloud-only. FasterFixes charges a flat monthly rate;
        Atarim charges per seat ($25/seat/month on Pro). FasterFixes ships a
        widget that installs with a script tag on any site or as a React
        package, and captures DOM selector, full browser context, and the React
        component tree on React sites. FasterFixes also includes an MCP server
        for AI coding agents; Atarim has no MCP integration.
      </p>
    ),
  },
  {
    question: "Does FasterFixes have video recording?",
    answer:
      "No. FasterFixes does not currently support video recording or session replay. It captures a screenshot, DOM selector, URL, browser, and viewport on each feedback item, plus the React component tree on React sites. Atarim does not offer video recording either; if video walkthroughs are a hard requirement, BugHerd or Userback include video features.",
  },
  {
    question: "Does Atarim support whitelabeling?",
    answer:
      "Yes, on the Enterprise plan (custom pricing). Atarim's whitelabel options include custom logo, favicon, color scheme, plugin name, and removal of all Atarim branding. This is one of Atarim's genuine strengths for agencies on Enterprise that deliver a branded client experience. FasterFixes does not currently offer whitelabeling.",
  },
  {
    question: "What does the MCP server do?",
    answer:
      "@fasterfixes/mcp is a Model Context Protocol server that connects Claude Code, Cursor, and Codex to your FasterFixes workspace. Feedback items are accessible directly in the terminal, no browser tab switching, no copy-pasting issue descriptions into a chat window. Atarim does not have an MCP integration: its InnerCircle AI agents run only inside the Atarim dashboard.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        @fasterfixes/mcp is a Model Context Protocol server that connects Claude
        Code, Cursor, and Codex to your FasterFixes workspace. Feedback items
        are accessible directly in the terminal. Atarim does not have an MCP
        integration: its InnerCircle AI agents run only inside the Atarim
        dashboard. See{" "}
        <DocLink href={"/docs/mcp/setup" as Route}>MCP setup</DocLink> and the{" "}
        <DocLink href={"/docs/mcp/tools" as Route}>tool reference</DocLink>.
      </p>
    ),
  },
  {
    question: "How do I install FasterFixes on my site?",
    answer:
      "Add one script tag with your Project ID to any site: WordPress, Webflow, static HTML, or an app built with Vue, Angular, Svelte, or any other framework. In a React or Next.js app, you can instead run npm install @fasterfixes/react and wrap the app in FeedbackProvider with your Project ID. Both embeds share the same widget, options, and captured context.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Add one script tag with your Project ID to any site: WordPress, Webflow,
        static HTML, or an app built with Vue, Angular, Svelte, or any other
        framework. In a React or Next.js app, you can instead run npm install
        @fasterfixes/react and wrap the app in FeedbackProvider with your
        Project ID. Both embeds share the same widget, options, and captured
        context. See the{" "}
        <DocLink href={"/docs/widget/script-embed" as Route}>
          script embed docs
        </DocLink>
        , the{" "}
        <DocLink href={"/docs/widget/react" as Route}>React embed docs</DocLink>
        , and the{" "}
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
      "Yes. The script embed installs the widget with one script tag on any site, including WordPress and plain HTML, with the same screenshot, DOM selector, URL, browser, viewport, console, and network capture as the React embed. The React component path is added when the site runs React. Atarim still offers a dedicated WordPress plugin and a Chrome extension, which FasterFixes does not.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The script embed installs the widget with one script tag on any
        site, including WordPress and plain HTML, with the same screenshot, DOM
        selector, URL, browser, viewport, console, and network capture as the
        React embed. The React component path is added when the site runs React.
        Atarim still offers a dedicated WordPress plugin and a Chrome extension,
        which FasterFixes does not. See the{" "}
        <DocLink href={"/docs/widget/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "How do I migrate from Atarim?",
    answer:
      "Four steps: export open tasks from Atarim via CSV or your connected PM tool, deploy FasterFixes (self-hosted or hosted Pro), replace the Atarim JS snippet (or WordPress plugin) with the FasterFixes script tag or @fasterfixes/react, then invite your team and connect GitHub, Linear, or Jira for two-way sync. The full guide is in the migration section above.",
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
