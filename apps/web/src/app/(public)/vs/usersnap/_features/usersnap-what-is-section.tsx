import type { Route } from "next";
import { ReportFlowIllustration } from "../../_components/illustrations/report-flow-illustration";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: "A script tag on any site, or a package for React, Vue, Angular and Svelte.",
    link: {
      href: "/docs/widget/overview" as Route,
      label: "Widget setup guide",
    },
  },
  {
    title: "Self-host on your stack",
    body: "Next.js, Postgres and S3-compatible storage. Client feedback never leaves your environment.",
    link: { href: "/docs/self-hosting" as Route, label: "Self-hosting guide" },
  },
  {
    title: "Two-way sync with your issue tracker",
    body: "Each report becomes a GitHub, Linear, Jira or Trello issue, and closing one side resolves the other.",
    link: {
      href: "/docs/integrations/github" as Route,
      label: "Integrations",
    },
  },
  {
    title: "MCP server for AI coding agents",
    body: "Claude Code, Cursor and Codex read the report, find the code and propose the fix.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
];

export function UsersnapWhatIsSection() {
  return (
    <VsSection
      eyebrow="The open-source alternative"
      title="If Usersnap is not the right fit, FasterFixes might be"
      intro="FasterFixes is an open-source feedback widget for developers fixing client sites. A client clicks what looks wrong and writes one sentence, with no account. The report reaches your tracker and your coding agent with the context needed to fix it."
      tone="muted"
    >
      <ReportFlowIllustration />
      {/* Points follow the diagram from left to right. */}
      <VsPointGrid points={points} className="mt-16" />
    </VsSection>
  );
}
