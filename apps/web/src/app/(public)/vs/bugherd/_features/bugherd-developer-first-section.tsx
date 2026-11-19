import type { Route } from "next";
import Link from "next/link";
import { AgentMcpSessionAnimation } from "../../../features/actionable-bug-reports/_components/illustrations/agent-mcp-session-animation";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: (
      <>
        Paste one script tag on any site, from WordPress and Webflow to Vue,
        Angular, or Svelte apps, or run npm install @fasterfixes/react and wrap
        your React app in FeedbackProvider. Same widget, same options, same
        captured context either way: a{" "}
        <Link href={"/features/website-annotation" as Route}>
          website annotation tool
        </Link>{" "}
        your clients use without an account or an extension.
      </>
    ),
    link: {
      href: "/docs/widget/install/script-embed" as Route,
      label: "Script embed docs",
    },
  },
  {
    title: "Captures the React component tree",
    body: (
      <>
        Every feedback item ships with the DOM selector and, when the site runs
        React, the React component path. Your agent knows which file owns the
        bug, not just where it appears on screen: a{" "}
        <Link href={"/features/actionable-bug-reports" as Route}>
          website bug reporting tool
        </Link>{" "}
        built for developers.
      </>
    ),
    link: {
      href: "/docs/concepts/how-it-works" as Route,
      label: "How it works",
    },
  },
  {
    title: "Bring your own AI agent",
    body: "@fasterfixes/mcp plugs into Claude Code, Cursor, Codex, and any other MCP-compatible client. Pick the model you want; your agent lists open feedback, reads the technical context, applies a fix, and resolves the item without leaving the terminal.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
  {
    title: "Open source, on GitHub",
    body: "AGPL-3.0 for the dashboard, MIT for the widget packages. Read the code, fork it, run it on your own infrastructure. No vendor in the loop at project hand-off.",
    link: { href: "/docs/self-hosting" as Route, label: "Self-hosting guide" },
  },
];

export function BugherdDeveloperFirstSection() {
  return (
    <VsSection
      eyebrow="Made for developers"
      title="Built around the editor, not the dashboard"
      intro="FasterFixes is shaped for teams whose primary workspace is the codebase, not a project board."
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <VsPointGrid points={points} columns={1} />
        <div aria-hidden className="lg:sticky lg:top-24">
          <AgentMcpSessionAnimation />
        </div>
      </div>
    </VsSection>
  );
}
