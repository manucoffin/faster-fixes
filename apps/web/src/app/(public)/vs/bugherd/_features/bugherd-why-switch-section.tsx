import { VsPointGrid } from "../../_features/vs-point-grid";
import { VsSection } from "../../_features/vs-section";

const limitations = [
  {
    title: "Closed source, no self-hosting",
    body: "BugHerd is proprietary SaaS. You cannot read the code, audit how feedback is stored, or run it on your own infrastructure. Client feedback lives in a vendor's database you do not control.",
  },
  {
    title: "Per-seat pricing scales with your team",
    body: "Standard is $50/month for 5 members and every extra user is $8/month. Studio jumps to $80/month for 10, Premium to $150/month for 25, and Premium is the first plan with Jira and Linear. The bill grows with the team, not with the value delivered.",
  },
  {
    title: "AI is bundled, not bring-your-own",
    body: "BugHerd AI (Beta) is a feature inside the dashboard. You do not pick the model and you cannot point Claude Code, Cursor, or Codex at your feedback queue. FasterFixes ships an MCP server: you choose the agent and the model.",
  },
  {
    title: "Built around QA and project management",
    body: "Most BugHerd value lives in the management surface: kanban for clients, deep integrations with Asana, ClickUp, Monday.com, Trello. Genuinely useful for QA-led teams. Overhead if your day-to-day is the codebase.",
  },
];

export function BugherdWhySwitchSection() {
  return (
    <VsSection
      eyebrow="Where BugHerd falls short"
      title="Why teams switch from BugHerd"
      className="border-t"
    >
      <VsPointGrid points={limitations} />
    </VsSection>
  );
}
