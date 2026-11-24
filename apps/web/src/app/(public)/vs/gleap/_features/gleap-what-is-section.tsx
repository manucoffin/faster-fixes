import type { Route } from "next";
import { SectionBody } from "../../../features/_components/section-body";
import { ReportFlowIllustration } from "../../_components/illustrations/report-flow-illustration";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "One widget, any stack",
    body: "A script tag covers any site, with packages for React, Vue, Angular and Svelte.",
    link: {
      href: "/docs/widget/install/script-embed" as Route,
      label: "Script embed guide",
    },
  },
  {
    title: "Context captured, not typed",
    body: "Every Feedback carries a screenshot, a replay of the last minute, the URL and DOM selector, browser, viewport, console logs, network requests and, on React sites, the component tree.",
    link: {
      href: "/features/actionable-bug-reports" as Route,
      label: "What a report contains",
    },
  },
  {
    title: "Two-way sync with your tracker",
    body: "Each Feedback becomes a GitHub, Linear, Jira or Trello item, and closing one side resolves the other.",
    link: {
      href: "/integrations/github" as Route,
      label: "GitHub integration",
    },
  },
  {
    title: "Your agent fixes it",
    body: "@fasterfixes/mcp lets Claude Code, Cursor and Codex read a Feedback, find the code, propose a fix and set the Status.",
    link: { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
  },
];

export function GleapWhatIsSection() {
  return (
    <VsSection
      eyebrow="The open-source alternative"
      title="If Gleap is not the right fit, FasterFixes might be"
      intro="FasterFixes is an open-source feedback widget for teams that fix their own client sites. A client clicks what looks wrong and writes one sentence, with no account and no extension. What arrives is a markdown report your tracker and your coding agent can both read."
    >
      <ReportFlowIllustration />
      {/* Points follow the diagram from left to right. */}
      <VsPointGrid points={points} className="mt-16" />
      <SectionBody className="mt-10 max-w-2xl text-base">
        <p>
          FasterFixes has no live chat, no AI chatbot, no ticketing inbox and no
          mobile SDKs. It reports bugs on websites and web apps, and nothing
          else.
        </p>
      </SectionBody>
    </VsSection>
  );
}
