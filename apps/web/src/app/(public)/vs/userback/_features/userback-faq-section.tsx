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

export const userbackFaqs: RichFaqItem[] = [
  {
    question: "Is FasterFixes free?",
    answer:
      "Yes. The free plan includes 1 project, 50 feedback items, and 1 member, no credit card required. The self-hosted version is also free under AGPL-3.0; you only pay for your own hosting infrastructure (typically $5-20/month on Railway or Vercel).",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The free plan includes 1 project, 50 feedback items, and 1 member,
        no credit card required. The self-hosted version is also free under
        AGPL-3.0; you only pay for your own hosting infrastructure (typically
        $5-20/month on Railway or Vercel). See the{" "}
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
      "Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Userback has no self-hosted option. Deploy on Vercel, Railway, or any Node-compatible host. The dashboard is AGPL-3.0; the widget packages are MIT.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The stack is Next.js, Postgres, Inngest, and R2 or S3-compatible
        storage. Userback has no self-hosted option. Deploy on Vercel, Railway,
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
    question: "How is FasterFixes different from Userback?",
    answer:
      "FasterFixes is open-source and self-hostable; Userback is closed-source and cloud-only. FasterFixes captures DOM selector, URL, browser, and viewport on every report, plus the React component tree on React sites. Userback is a broader platform with annotated video, session replay, NPS surveys, and a feature portal. FasterFixes does not currently offer those features. FasterFixes is built specifically for developer teams who need structured bug reports, not a full product analytics suite.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        FasterFixes is open-source and self-hostable; Userback is closed-source
        and cloud-only. FasterFixes captures DOM selector, URL, browser, and
        viewport on every report, plus the React component tree on React sites.
        Userback is a broader platform with annotated video, session replay, NPS
        surveys, and a feature portal. FasterFixes does not currently offer
        those features.
      </p>
    ),
  },
  {
    question: "Does FasterFixes have video recording?",
    answer:
      "No. FasterFixes captures screenshots, component tree, DOM selector, URL, browser, and viewport. For annotated video feedback or session replay, Userback or a dedicated tool like Loom is a better fit.",
  },
  {
    question: "Does FasterFixes have session replay?",
    answer:
      "No. FasterFixes is focused on structured developer feedback, not session analytics. If session replay is a core requirement, Userback Business or a dedicated tool like LogRocket is a better fit.",
  },
  {
    question: "What does the MCP server do?",
    answer:
      "@fasterfixes/mcp connects Claude Code, Cursor, and Codex to your FasterFixes workspace. Feedback items are accessible directly in the terminal, no browser tab switching, no copy-pasting issue descriptions into a chat window. Userback also offers an MCP server, but FasterFixes is open-source and self-hostable end to end.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        @fasterfixes/mcp connects Claude Code, Cursor, and Codex to your
        FasterFixes workspace. Feedback items are accessible directly in the
        terminal, no browser tab switching, no copy-pasting issue descriptions
        into a chat window. Userback also offers an MCP server, but FasterFixes
        is open-source and self-hostable end to end. See{" "}
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
      "Yes. The script embed installs the widget with one script tag on any site, with the same screenshot, DOM selector, URL, browser, viewport, console, and network capture as the React embed. The React component path is added when the site runs React. Unlike Userback, FasterFixes does not offer a browser extension.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The script embed installs the widget with one script tag on any
        site, with the same screenshot, DOM selector, URL, browser, viewport,
        console, and network capture as the React embed. The React component
        path is added when the site runs React. Unlike Userback, FasterFixes
        does not offer a browser extension. See the{" "}
        <DocLink href={"/docs/widget/script-embed" as Route}>
          script embed docs
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "How do I migrate from Userback?",
    answer:
      "Export your feedback as CSV from Userback (Settings > Export), then deploy or sign up for FasterFixes, install the widget, and connect GitHub, Linear, and Jira (any combination) on a paid plan. Note that video recordings, session replays, and survey responses do not migrate. FasterFixes does not support those features. The full 4-step guide is in the migration section above.",
  },
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The FasterFixes dashboard is licensed under AGPL-3.0 and the widget under MIT. The source code is publicly available on GitHub. You can inspect it, self-host it, and contribute to it. Userback is proprietary and closed-source.",
  },
];

export function UserbackFaqSection() {
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
            {userbackFaqs.map((faq) => (
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
