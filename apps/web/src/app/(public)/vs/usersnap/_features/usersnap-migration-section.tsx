import { WidgetSwapAnimation } from "../../_components/illustrations/widget-swap-animation";
import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your feedback data from Usersnap",
    body: "Export your existing feedback items from Usersnap and keep a local copy before you cancel. Its REST API is available on Premium and Enterprise only. Survey responses have no equivalent in FasterFixes and will not carry over.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Choose self-hosted (Next.js, Postgres, Inngest, R2/S3) or sign up for the hosted Pro plan. The self-hosted path takes roughly 30 minutes with the provided setup docs. No account required for clients submitting feedback.",
  },
  {
    label: "Replace the Usersnap widget",
    body: "Remove the Usersnap script from your codebase. Paste the FasterFixes script tag in its place, or in a React app run npm install @fasterfixes/react and wrap your app in FeedbackProvider. Generate a shareable link for each client, no client account required.",
  },
  {
    label: "Invite your team and connect your issue tracker",
    body: "Add team members from the dashboard and connect your GitHub repository, your Linear workspace, your Jira Cloud site, or any combination, for two-way issue sync. Configure @fasterfixes/mcp in your IDE or terminal to give your coding agent direct access to incoming feedback.",
  },
];

export function UsersnapMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Usersnap"
      intro="No one-click import. Export your data, replace the widget, and wire up the integrations. The whole process takes under an hour."
      tone="muted"
    >
      <VsSteps
        steps={migrationSteps}
        illustration={
          <WidgetSwapAnimation
            competitorName="Usersnap"
            competitorScriptSrc="https://widget.usersnap.com/global/load/…"
          />
        }
      />
    </VsSection>
  );
}
