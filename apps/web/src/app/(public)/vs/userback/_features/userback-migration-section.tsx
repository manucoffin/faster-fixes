import { WidgetSwapAnimation } from "../../_components/illustrations/widget-swap-animation";
import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your feedback data from Userback",
    body: "Download your feedback items from Userback via Settings > Export. CSV export is available on all plans. Note: screen recordings and survey responses have no equivalent in FasterFixes, and session replays will not carry over: a Recording is captured with each new feedback.",
  },
  {
    label: "Deploy FasterFixes",
    body: "Choose self-hosted (Next.js, Postgres, Inngest, R2/S3) or sign up for the hosted Pro plan. The self-hosted path takes roughly 30 minutes with the provided setup docs. No account required for clients submitting feedback.",
  },
  {
    label: "Replace the Userback widget",
    body: "Remove the Userback script from your codebase. Add the FasterFixes script tag to your site, or in a React app install @fasterfixes/react and wrap the app in FeedbackProvider. Generate a shareable link for each client, no client account required.",
  },
  {
    label: "Invite your team and connect your issue tracker",
    body: "Add team members from the dashboard and connect your GitHub repository, your Linear workspace, your Jira Cloud site, or any combination, for two-way issue sync. Configure @fasterfixes/mcp in your IDE or terminal to give your coding agent direct access to incoming feedback.",
  },
];

export function UserbackMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Userback"
      intro="No one-click import. Export your data, replace the widget, and wire up the integrations. The whole process takes under an hour."
      tone="muted"
    >
      <VsSteps
        steps={migrationSteps}
        illustration={
          <WidgetSwapAnimation
            competitorName="Userback"
            competitorScriptSrc="https://static.userback.io/widget/v1.js"
          />
        }
      />
    </VsSection>
  );
}
