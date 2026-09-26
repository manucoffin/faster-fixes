import type { Route } from "next";
import Link from "next/link";

const points = [
  {
    title: "One widget, any stack",
    body: "Add one script tag to any site, including WordPress, Webflow, or static HTML, or run npm install @fasterfixes/react in a React app. The widget captures DOM selector, URL, browser, and viewport on every feedback item automatically, plus the React component path on React sites. No manual annotation needed.",
    href: "/docs/widget/script-embed" as Route,
    linkLabel: "Widget setup guide",
  },
  {
    title: "MCP server for AI coding agents",
    body: "@fasterfixes/mcp is a Model Context Protocol server that lets AI coding agents such as Claude Code, Cursor, and Codex read feedback items directly from the terminal or IDE. No context-switching between a dashboard and your editor. Your agent fetches the feedback, locates the relevant code, and can apply the fix unattended.",
    href: "/docs/mcp/setup" as Route,
    linkLabel: "MCP setup",
  },
  {
    title: "Self-host on your stack",
    body: "Deploy on Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Full infrastructure control, no vendor in the loop, and no client feedback leaving your environment. Step-by-step deployment docs included.",
    href: "/docs/self-hosting" as Route,
    linkLabel: "Self-hosting guide",
  },
  {
    title: "GitHub, Linear, and Jira two-way sync",
    body: "Each feedback item creates a GitHub issue, a Linear ticket, or a Jira Cloud issue: your pick, or all three at once. The issue carries the full structured report: screenshot, component path, selector, environment. Closing the issue resolves the feedback in FasterFixes, and vice versa. Linear sync maps by workflow-state type and Jira sync by status category, so renamed states still work. No manual copy-pasting between tools.",
    href: "/docs/integrations/jira" as Route,
    linkLabel: "Jira integration",
  },
];

export function AtarimDeveloperFirstSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Made for developers
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Built around the editor, not the dashboard
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            FasterFixes is shaped for teams whose primary workspace is the
            codebase, not a client review platform.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {points.map((point) => (
            <div
              key={point.title}
              className="rounded-xl border bg-muted/30 p-7"
            >
              <h3 className="text-lg font-semibold">{point.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {point.body}
              </p>
              <Link
                href={point.href}
                className="mt-4 inline-block text-sm text-foreground underline underline-offset-4 hover:no-underline"
              >
                {point.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
