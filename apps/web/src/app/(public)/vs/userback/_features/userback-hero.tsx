import { UserbackReportToTrackerAnimation } from "../_components/illustrations/userback-report-to-tracker-animation";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

export function UserbackHero() {
  return (
    <VsHero
      breadcrumbLabel="Userback alternative"
      eyebrow="Userback alternative"
      title="The open-source Userback alternative"
      description="FasterFixes is an open-source, self-hostable alternative to Userback, licensed AGPL-3.0 and priced flat rather than per seat. Each report captures a screenshot, DOM selector, React component tree, console logs, and network requests, structured for GitHub, Linear, or Jira rather than a support inbox. An MCP server exposes those reports to Claude Code, Cursor, and Codex."
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
      illustration={<UserbackReportToTrackerAnimation />}
    />
  );
}
