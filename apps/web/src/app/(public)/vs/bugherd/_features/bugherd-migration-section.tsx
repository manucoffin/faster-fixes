import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your BugHerd data",
    body: "BugHerd exports tasks as CSV, XML or JSON on every plan. Download them before you close the account.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Sign up for the hosted version, or self-host it on Next.js, Postgres, Inngest and R2/S3.",
  },
  {
    label: "Swap the widget",
    body: "Replace the BugHerd script with the FasterFixes script tag, or install @fasterfixes/react in a React app. Clients need no account.",
  },
  {
    label: "Import open feedback with your agent",
    body: "Connect @fasterfixes/mcp and hand your coding agent the export. Its create_feedbacks tool imports the items with their original timestamps, without opening tracker issues.",
  },
];

export function BugherdMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from BugHerd"
      intro="There is no one-click import. Export your data, swap the widget, and let your coding agent import the open items."
      tone="muted"
    >
      <VsSteps steps={migrationSteps} />
    </VsSection>
  );
}
