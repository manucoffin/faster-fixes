import { McpImportAnimation } from "../../_components/illustrations/mcp-import-animation";
import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your Marker.io data",
    body: "Download your existing feedback as CSV from the Marker.io dashboard before you cancel the subscription. Keep the export as a reference for active items.",
  },
  {
    label: "Set up FasterFixes in under five minutes",
    body: "Start on the hosted free plan or follow the self-hosting guide to deploy on your own infrastructure. Paste the script tag on your site, or wrap your React app in FeedbackProvider from @fasterfixes/react, then generate a shareable link for each client. No account required for clients.",
  },
  {
    label: "Import active feedback via the MCP",
    body: "Connect @fasterfixes/mcp to your AI agent and point it at the Marker.io CSV. The agent parses the file and calls the create_feedbacks tool to bulk-import items, up to 100 per call, with original timestamps preserved and attributed to a named reviewer. The import skips integration fan-out, so migrated items do not open issues in GitHub, Linear, or Jira.",
  },
  {
    label: "Know what you give up",
    body: "Marker.io has features FasterFixes does not currently offer: feedback on Figma / PDFs / images, browser extensions, Asana / ClickUp / Trello sync, a client-facing Guest Portal, and SSO. If those are core to your workflow, weigh them before switching.",
  },
];

export function MarkerIoMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from Marker.io"
      intro="No one-click import button. Hand your AI agent the existing export and the MCP backfills the dashboard for you."
      tone="muted"
    >
      <VsSteps
        steps={migrationSteps}
        illustration={
          <McpImportAnimation
            competitorName="Marker.io"
            exportFormats={["CSV"]}
          />
        }
      />
    </VsSection>
  );
}
