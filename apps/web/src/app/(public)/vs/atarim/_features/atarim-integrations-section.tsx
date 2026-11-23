import type { Route } from "next";
import { type VsPoint, VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const points: VsPoint[] = [
  {
    title: "WordPress plugin and Chrome extension",
    body: "The plugin makes Atarim native inside wp-admin, and the extension comments on any site without a snippet. Both are missing from FasterFixes, where installation is one script tag.",
    link: {
      href: "/docs/widget/install/script-embed" as Route,
      label: "Script embed guide",
    },
  },
  {
    title: "Project management integrations",
    body: "Atarim lists Jira, Asana, ClickUp, Monday.com, Trello, Basecamp, Teamwork, Slack, Figma, Zapier, Pabbly and Make. Forms reach Atarim through Zapier, Make or Pabbly, with no native form field. FasterFixes syncs GitHub, Linear, Jira and Trello two-way, with Slack notifications.",
    link: { href: "/integrations/jira" as Route, label: "Jira integration" },
  },
  {
    title: "Source code and open source",
    body: "Atarim is proprietary: no public source and no self-hosted build. Its free MCP server connects Claude, Codex and other MCP clients to Atarim tasks, sites and workflows. FasterFixes publishes its dashboard under AGPL-3.0 and its widget under MIT, and its MCP is scoped to one Feedback at a time.",
    link: { href: "/open-source" as Route, label: "Open source" },
  },
];

export function AtarimIntegrationsSection() {
  return (
    <VsSection
      eyebrow="Integrations"
      title="Atarim integrations and the WordPress plugin"
      intro="Atarim reaches a site three ways: a JS snippet, a Chrome extension and a dedicated WordPress plugin. Two of those have no FasterFixes equivalent."
      tone="muted"
    >
      <VsPointGrid points={points} columns={1} />
    </VsSection>
  );
}
