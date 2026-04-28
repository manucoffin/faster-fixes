import type { Route } from "next";
import Link from "next/link";

const points = [
  {
    title: "Framework-native React widget",
    body: "Run npm install @fasterfixes/react and drop the component into your layout. The widget captures component tree, DOM selector, URL, browser, and viewport on every feedback item automatically — no manual annotation needed. React and Next.js today; more frameworks coming.",
    href: "/docs/widget/react" as Route,
    linkLabel: "Widget setup guide",
  },
  {
    title: "MCP server for AI coding agents",
    body: "@fasterfixes/mcp is a Model Context Protocol server that lets AI coding agents — Claude Code, Cursor, Codex — read feedback items directly from the terminal or IDE. No context-switching between a dashboard and your editor. Your agent fetches the feedback, locates the relevant code, and can apply the fix unattended.",
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
    title: "GitHub two-way sync",
    body: "Each feedback item creates a GitHub issue with the full structured report — screenshot, component path, selector, environment. Closing the issue resolves the feedback in FasterFixes, and vice versa. No manual copy-pasting between tools.",
    href: "/docs/integrations/github" as Route,
    linkLabel: "GitHub integration",
  },
];

export function UsersnapDeveloperFirstSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Made for developers
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Built around the editor, not the dashboard
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            FasterFixes is shaped for teams whose primary workspace is the
            codebase, not a survey platform.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {points.map((point) => (
            <div
              key={point.title}
              className="bg-muted/30 rounded-xl border p-7"
            >
              <h3 className="text-lg font-semibold">{point.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {point.body}
              </p>
              <Link
                href={point.href}
                className="text-foreground mt-4 inline-block text-sm underline underline-offset-4 hover:no-underline"
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
