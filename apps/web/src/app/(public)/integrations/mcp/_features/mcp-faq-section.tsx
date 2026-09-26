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

type DocLinkProps = { href: Route; children: ReactNode };

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

export const mcpFaqs: RichFaqItem[] = [
  {
    question: "Which AI coding agents does the MCP server support?",
    answer:
      "Claude Code, Cursor, Windsurf, VS Code (GitHub Copilot), Zed, Codex, and any other agent that speaks the Model Context Protocol. The server runs over standard MCP via stdio, so there's no custom integration per editor.",
  },
  {
    question: "Do my clients need an account to use the MCP server?",
    answer:
      "No. The MCP server uses an agent token scoped to your project. Clients never touch the agent or the token. They only use the Faster Fixes feedback widget on your site.",
  },
  {
    question: "Can I point the MCP server at a self-hosted instance?",
    answer:
      "Yes. The server talks to whatever the FASTER_FIXES_URL environment variable points at. It defaults to the cloud; set it to your self-hosted instance URL (alongside FASTER_FIXES_TOKEN and FASTER_FIXES_PROJECT) and the agent works against your own deployment.",
  },
  {
    question: "Is the MCP server available on the free plan?",
    answer:
      "Yes. Agent tokens and all three tools are available on every plan, including the free Community edition. The tools are list_feedbacks, update_feedback_status, and create_feedbacks. Bulk create is capped at your plan's feedback limit.",
  },
  {
    question: "How do I migrate existing feedback from another tool?",
    answer:
      "Export your current tool's data as CSV or JSON, parse it, and call create_feedbacks with up to 100 items per call. The batch is atomic and skips integration fan-out. Tag the source tool for traceability. Full instructions are in the API reference.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Export your current tool&apos;s data as CSV or JSON, parse it, and call{" "}
        <code>create_feedbacks</code> with up to 100 items per call. The batch
        is atomic and skips integration fan-out. Tag the source tool for
        traceability. Full instructions are in the{" "}
        <DocLink href={"/docs/api-reference/agent-api" as Route}>
          API reference
        </DocLink>
        .
      </p>
    ),
  },
  {
    question: "Is the MCP server open source?",
    answer:
      "Yes. The server is open source under the MIT license and published as @fasterfixes/mcp on npm. Inspect the source, fork it, or contribute. There are no proprietary dependencies in the server itself.",
    content: (
      <p className="text-lg text-muted-foreground md:text-xl">
        Yes. The server is open source under the MIT license and published as{" "}
        <a
          href="https://www.npmjs.com/package/@fasterfixes/mcp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          @fasterfixes/mcp on npm
        </a>
        . Inspect the source, fork it, or contribute. There are no proprietary
        dependencies in the server itself.
      </p>
    ),
  },
];

export function McpFaqSection() {
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
            {mcpFaqs.map((faq) => (
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
