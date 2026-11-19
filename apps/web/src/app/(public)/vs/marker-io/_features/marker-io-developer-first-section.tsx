import type { Route } from "next";
import Link from "next/link";
import { TwoWaySyncAnimation } from "../../_components/illustrations/two-way-sync-animation";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: (
      <>
        Paste one script tag on any site, or run npm install @fasterfixes/react
        and wrap your React app in FeedbackProvider. Both embeds capture the
        same context, and on React sites every report also carries the component
        path. Reviewers get{" "}
        <Link href={"/features/website-annotation" as Route}>
          website annotation
        </Link>{" "}
        with no browser extension to install.
      </>
    ),
    link: {
      href: "/docs/widget/install/react" as Route,
      label: "Widget setup guide",
    },
  },
  {
    title: "MCP server for AI coding agents",
    body: "@fasterfixes/mcp exposes your feedback queue to any MCP-compatible agent. Claude Code, Cursor, and Codex can read open issues, fetch the DOM selector and component path, apply a fix, and resolve the item without leaving the terminal.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
  {
    title: "Self-host on your stack",
    body: "Deploy on Next.js, Postgres, Inngest, and R2 or S3-compatible storage. Full infrastructure control, no vendor in the loop, and no client feedback leaving your environment. Step-by-step deployment docs included.",
    link: { href: "/docs/self-hosting" as Route, label: "Self-hosting guide" },
  },
  {
    title: "GitHub, Linear, and Jira two-way sync",
    body: "Each feedback item creates a GitHub issue, Linear ticket, or Jira Cloud issue: your pick, or all three at once. The issue carries the full structured report: screenshot, component path, selector, environment. Closing the issue resolves the feedback in FasterFixes, and vice versa. Linear sync maps by workflow-state type and Jira sync by status category, so renamed states still work. More PM integrations are in progress.",
    link: {
      href: "/docs/integrations/jira" as Route,
      label: "Jira integration",
    },
  },
];

export function MarkerIoDeveloperFirstSection() {
  return (
    <VsSection
      eyebrow="Made for developers"
      title="Built around the editor, not the dashboard"
      intro="FasterFixes is shaped for teams whose primary workspace is the codebase, not a project board."
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
