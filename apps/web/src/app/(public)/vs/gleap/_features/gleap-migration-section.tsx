import { PLAN_PRICES, SubscriptionPlanName } from "@/app/_domains/subscription";
import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

const proPrice = PLAN_PRICES[SubscriptionPlanName.Pro];

export const migrationSteps: VsStep[] = [
  {
    label: "Export open bug reports",
    body: "Pull them out before you cancel, from the tracker Gleap already syncs to or through its API.",
  },
  {
    label: "Deploy FasterFixes",
    body: `Self-host on Next.js, Postgres, Inngest and R2 or S3, or start hosted on Pro at $${proPrice}/mo.`,
  },
  {
    label: "Swap the web SDK",
    body: "Remove the Gleap JavaScript SDK, then add the FasterFixes script tag or a framework package. Keep Gleap on native apps if you still need it there.",
  },
  {
    label: "Connect the tracker and the agent",
    body: "Wire GitHub, Linear, Jira or Trello for two-way sync, then add @fasterfixes/mcp to Claude Code or Cursor.",
  },
];

export function GleapMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Gleap"
      intro="There is no one-click import: export what is open, swap the widget, connect the tracker."
      tone="muted"
    >
      <VsSteps steps={migrationSteps} />
    </VsSection>
  );
}
