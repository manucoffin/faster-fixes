import type { Route } from "next";
import Link from "next/link";
import { TwoWaySyncAnimation } from "../../_components/illustrations/two-way-sync-animation";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: "Paste one script tag on any site, or run npm install @fasterfixes/react and wrap your React app in FeedbackProvider. The widget captures DOM selector, URL, browser, and viewport on every feedback item automatically, plus the component tree on React sites, no manual annotation needed.",
    link: {
      href: "/docs/widget/install/react" as Route,
      label: "Widget setup guide",
    },
  },
  {
    title: "MCP server for AI coding agents",
    body: "@fasterfixes/mcp is a Model Context Protocol server that lets AI coding agents such as Claude Code, Cursor, and Codex read feedback items directly from the terminal or IDE. No context-switching between a dashboard and your editor. Your agent fetches the feedback, locates the relevant code, and can apply the fix unattended.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
  {
    title: "Self-host on your stack",
    body: "Deploy on Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Full infrastructure control, no vendor in the loop, and no client feedback leaving your environment. Step-by-step deployment docs included.",
    link: { href: "/docs/self-hosting" as Route, label: "Self-hosting guide" },
  },
  {
    title: "GitHub, Linear, and Jira two-way sync",
    body: "Each feedback item creates a GitHub issue, a Linear ticket, or a Jira Cloud issue: your pick, or all three at once. The issue carries the full structured report: screenshot, component path, selector, environment. Closing the issue resolves the feedback in FasterFixes, and vice versa. Linear sync maps by workflow-state type and Jira by status category, so renamed states still work. Available on paid plans.",
    link: {
      href: "/docs/integrations/jira" as Route,
      label: "Jira integration",
    },
  },
];

export function UsersnapDeveloperFirstSection() {
  return (
    <VsSection
      eyebrow="Made for developers"
      title="Built around the editor, not the dashboard"
      intro={
        <>
          FasterFixes is an{" "}
          <Link href="/open-source">open-source feedback widget</Link> shaped
          for teams whose primary workspace is the codebase, not a survey
          platform.
        </>
      }
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <VsPointGrid points={points} columns={1} />
        <div className="lg:sticky lg:top-24">
          <TwoWaySyncAnimation />
        </div>
      </div>
    </VsSection>
  );
}
