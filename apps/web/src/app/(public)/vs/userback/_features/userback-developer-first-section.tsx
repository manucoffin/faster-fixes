import type { Route } from "next";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";
import { ReportFlowIllustration } from "../../_components/illustrations/report-flow-illustration";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: "Add one script tag to any site, including WordPress, Webflow, or static HTML, or install @fasterfixes/react in a React app. Each report captures the DOM selector, URL, browser, and viewport, plus the React component path on React sites.",
    link: {
      href: "/docs/widget/install/script-embed" as Route,
      label: "Widget setup guide",
    },
  },
  {
    title: "Self-host on your stack",
    body: "Deploy on Next.js, Postgres, Inngest, and R2 or S3-compatible storage. No vendor in the loop, and no client feedback leaving your environment.",
    link: { href: "/docs/self-hosting" as Route, label: "Self-hosting guide" },
  },
  {
    title: "Two-way sync with your issue tracker",
    body: "Each report becomes a GitHub issue, Linear ticket, or Jira issue with the screenshot, component path, and selector. Closing the issue resolves the feedback, and the other way round. Available on paid plans.",
    link: {
      href: "/docs/integrations/jira" as Route,
      label: "Jira integration",
    },
  },
  {
    title: "MCP server for AI coding agents",
    body: "@fasterfixes/mcp lets Claude Code, Cursor, and Codex read feedback from the terminal or IDE. Your agent fetches the report, locates the code, and proposes the fix.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
];

export function UserbackDeveloperFirstSection() {
  return (
    <VsSection
      eyebrow="The alternative"
      title="What is FasterFixes?"
      intro="FasterFixes is an open-source feedback widget and dashboard for teams that fix bugs in the codebase. Clients flag an issue on the page, and the report reaches your tracker and your coding agent with the context needed to fix it."
    >
      <div className="rounded-2xl bg-muted/50 p-6 sm:p-10">
        <ReportFlowIllustration />
      </div>
      {/* Points follow the diagram from left to right. */}
      <VsPointGrid points={points} className="mt-16" />
    </VsSection>
  );
}
