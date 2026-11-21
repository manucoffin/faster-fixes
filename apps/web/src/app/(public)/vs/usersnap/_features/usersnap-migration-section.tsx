import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your Usersnap feedback",
    body: "Keep a local copy before you cancel. Its REST API is on Premium and Enterprise only, and survey responses do not carry over.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Sign up for the hosted version, or self-host it on Next.js, Postgres, Inngest and R2/S3 in about 30 minutes.",
  },
  {
    label: "Swap the widget",
    body: "Replace the Usersnap script with the FasterFixes script tag, or install @fasterfixes/react in a React app. Clients need no account.",
  },
  {
    label: "Connect your tracker and your agent",
    body: "Connect GitHub, Linear, Jira or Trello for two-way sync, and add @fasterfixes/mcp to your editor.",
  },
];

export function UsersnapMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Usersnap"
      intro="There is no one-click import. Export your data, swap the widget, and connect your tools in under an hour."
    >
      <VsSteps steps={migrationSteps} />
    </VsSection>
  );
}
