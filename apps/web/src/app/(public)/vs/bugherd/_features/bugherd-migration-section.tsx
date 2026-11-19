import { McpImportAnimation } from "../../_components/illustrations/mcp-import-animation";
import { VsSection } from "../../_features/vs-section";
import { type VsStep, VsSteps } from "../../_features/vs-steps";

export const migrationSteps: VsStep[] = [
  {
    label: "Export your BugHerd data",
    body: "BugHerd supports exports as CSV, XML, and JSON from any plan. Pull tasks and feedback history from Project Settings before you close the account.",
  },
  {
    label: "Set up FasterFixes in under two minutes",
    body: "Paste the script tag on your site, or wrap your React app in FeedbackProvider from @fasterfixes/react, then generate a shareable link for each client. No account required for clients. Connect @fasterfixes/mcp to your coding agent if you use Claude Code, Cursor, or Codex.",
  },
  {
    label: "Import active feedback via the MCP",
    body: "Connect @fasterfixes/mcp to your AI agent and hand it the BugHerd CSV, XML, or JSON export. The agent parses the file and calls the create_feedbacks tool to bulk-import items, up to 100 per call, with original timestamps preserved and attributed to a named reviewer. The import skips integration fan-out, so migrated items do not open GitHub issues or Linear tickets.",
  },
  {
    label: "Know what you give up",
    body: "BugHerd has features FasterFixes does not currently offer: screen-recorded video feedback, feedback on Figma designs / PDFs / images, a client-facing kanban (Premium), and 20+ project-management integrations (Asana, ClickUp, Monday.com, Trello, ...). If those are core to your workflow, weigh them before switching.",
  },
];

export function BugherdMigrationSection() {
  return (
    <VsSection
      eyebrow="Migration"
      title="Switching from BugHerd"
      intro="No one-click import button. Still a short, scripted process, especially if you let your AI agent do the busywork."
      tone="muted"
    >
      <VsSteps
        steps={migrationSteps}
        illustration={
          <McpImportAnimation
            competitorName="BugHerd"
            exportFormats={["CSV", "XML", "JSON"]}
          />
        }
      />
    </VsSection>
  );
}
