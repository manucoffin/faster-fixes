import type { Route } from "next";
import Link from "next/link";
import { ReportFlowIllustration } from "../../_components/illustrations/report-flow-illustration";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: (
      <>
        A script tag on any site, or a package for React, Vue, Angular and
        Svelte. A{" "}
        <Link href={"/features/website-annotation" as Route}>
          website annotation tool
        </Link>{" "}
        clients use without an account or an extension.
      </>
    ),
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
    body: "Each report becomes a GitHub, Linear, Jira or Trello issue, and closing one side resolves the other. Jira is included, not reserved for a higher tier.",
    link: {
      href: "/docs/integrations/jira" as Route,
      label: "Jira integration",
    },
  },
  {
    title: "MCP server for AI coding agents",
    body: (
      <>
        Claude Code, Cursor and Codex read the{" "}
        <Link href={"/features/actionable-bug-reports" as Route}>
          bug report
        </Link>{" "}
        with its selector, component path and logs, find the code and propose
        the fix.
      </>
    ),
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
];

export function MarkerIoWhatIsSection() {
  return (
    <VsSection
      eyebrow="The open-source alternative"
      title="What is FasterFixes?"
      intro="FasterFixes is an open-source feedback widget for developers fixing client sites. A client clicks what looks wrong and writes one sentence, with no account. The report reaches your tracker and your coding agent with the context needed to fix it."
      tone="muted"
    >
      <ReportFlowIllustration />
      {/* Points follow the diagram from left to right. */}
      <VsPointGrid points={points} className="mt-16" />
    </VsSection>
  );
}
