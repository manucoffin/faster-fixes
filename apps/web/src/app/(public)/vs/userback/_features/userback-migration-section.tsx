import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

const migrationSteps: VsStep[] = [
  {
    label: "Export your Userback feedback",
    body: "Download your feedback as CSV from Settings > Export, available on every Userback plan. Screen recordings, session replays, and survey responses do not carry over.",
  },
  {
    label: "Swap the widget",
    body: "Sign up for the hosted version or self-host it. Replace the Userback script with the FasterFixes script tag, or install @fasterfixes/react in a React app. Clients need no account to send feedback.",
  },
  {
    label: "Connect your tracker and your agent",
    body: "Invite your team, connect GitHub, Linear, or Jira for two-way sync, and add @fasterfixes/mcp to your editor so your coding agent can read incoming feedback.",
  },
];

export function UserbackMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Userback"
      intro="There is no one-click import. Export your data, swap the widget, and connect your tools in under an hour."
      tone="muted"
    >
      <VsSteps steps={migrationSteps} />
    </VsSection>
  );
}
