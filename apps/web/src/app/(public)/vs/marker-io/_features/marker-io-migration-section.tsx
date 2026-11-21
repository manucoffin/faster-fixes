import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your Marker.io data",
    body: "Marker.io exports feedback as CSV from the dashboard. Download it before you cancel the subscription.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Sign up for the hosted version, or self-host it on Next.js, Postgres, Inngest and R2/S3.",
  },
  {
    label: "Swap the widget",
    body: "Replace the Marker.io snippet with the FasterFixes script tag, or install @fasterfixes/react in a React app. Clients need no account and no extension.",
  },
  {
    label: "Import open feedback with your agent",
    body: "Connect @fasterfixes/mcp and hand your coding agent the CSV. Its create_feedbacks tool imports the items with their original timestamps, without opening tracker issues.",
  },
];

export function MarkerIoMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Marker.io"
      intro="There is no one-click import. Export your data, swap the widget, and let your coding agent import the open items."
      tone="muted"
    >
      <VsSteps steps={migrationSteps} />
    </VsSection>
  );
}
