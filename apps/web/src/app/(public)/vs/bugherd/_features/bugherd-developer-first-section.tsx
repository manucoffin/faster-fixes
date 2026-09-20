import type { Route } from "next";
import Link from "next/link";

const points = [
  {
    title: "Framework-native, by design",
    body: "Run npm install @fasterfixes/react, drop the component into your layout, and you are done. We chose a framework-native widget over a generic JS tag: the trade-off is full control over the integration. React and Next.js today; more frameworks coming.",
    href: "/docs/widget/react" as Route,
    linkLabel: "React widget docs",
  },
  {
    title: "Captures the React component tree",
    body: "Every feedback item ships with the DOM selector and the React component path. Your agent knows which file owns the bug, not just where it appears on screen.",
    href: "/docs/concepts/how-it-works" as Route,
    linkLabel: "How it works",
  },
  {
    title: "Bring your own AI agent",
    body: "@fasterfixes/mcp plugs into Claude Code, Cursor, Codex, and any other MCP-compatible client. Pick the model you want; your agent lists open feedback, reads the technical context, applies a fix, and resolves the item without leaving the terminal.",
    href: "/docs/mcp/setup" as Route,
    linkLabel: "MCP setup",
  },
  {
    title: "Open source, on GitHub",
    body: "AGPL-3.0 for the dashboard, MIT for the widget packages. Read the code, fork it, run it on your own infrastructure. No vendor in the loop at project hand-off.",
    href: "/docs/self-hosting" as Route,
    linkLabel: "Self-hosting guide",
  },
];

export function BugherdDeveloperFirstSection() {
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
            codebase, not a project board.
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
