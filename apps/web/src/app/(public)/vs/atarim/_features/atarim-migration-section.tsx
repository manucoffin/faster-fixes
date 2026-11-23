import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

export const migrationSteps: VsStep[] = [
  {
    label: "Export open tasks",
    body: "Atarim exports tasks as CSV or through a connected tracker, while screenshots come down one at a time.",
  },
  {
    label: "Deploy FasterFixes",
    body: `Self-host on Next.js, Postgres, Inngest and R2 or S3, or start hosted on Pro at $${proPrice}/mo.`,
  },
  {
    label: "Replace the snippet",
    body: "Add the FasterFixes script tag or install @fasterfixes/react, then remove the Atarim plugin, extension and snippet.",
  },
  {
    label: "Connect the tracker and the agent",
    body: "Wire GitHub, Linear, Jira or Trello for two-way sync, then add @fasterfixes/mcp to Claude Code or Cursor.",
  },
];

export function AtarimMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Atarim"
      intro="There is no one-click import: export what is open, swap the widget, connect the tracker."
      tone="muted"
    >
      <VsSteps steps={migrationSteps} />
    </VsSection>
  );
}
