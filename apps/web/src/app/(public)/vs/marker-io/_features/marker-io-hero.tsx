import { MarkerIoReportToAgentAnimation } from "../_components/illustrations/marker-io-report-to-agent-animation";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

export function MarkerIoHero() {
  return (
    <VsHero
      breadcrumbLabel="Marker.io alternative"
      eyebrow="Marker.io alternative"
      title="The open-source alternative to Marker.io"
      description="FasterFixes is an open-source, self-hostable alternative to Marker.io, licensed AGPL-3.0 and priced flat rather than per seat. The difference goes beyond price: an MCP server lets Claude Code, Cursor, and Codex fetch and fix client feedback from the terminal, with every report carrying a screenshot, DOM selector, console logs, network requests, and the React component tree on React sites. Marker.io is closed-source and cloud-only."
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
      illustration={<MarkerIoReportToAgentAnimation />}
    />
  );
}
