"use client";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { ExternalLink } from "lucide-react";
import type { GetProjectJiraLinkOutput } from "../../_services/get-project-jira-link";
import { UnlinkJiraProjectButton } from "./unlink-project/unlink-jira-project-button.client";
import { AutoCreateIssuesSwitch } from "./update-link/auto-create-issues-switch.client";
import { DefaultLabelsEditor } from "./update-link/default-labels-editor.client";

// Keyed on ProjectJiraLink.linkHealthIssue. Each reason gets its own copy because
// the remedy differs: drift needs the link re-picked, a failed webhook refresh
// clears itself on the next weekly run.
const LINK_HEALTH_MESSAGES: Record<string, string> = {
  stale_project:
    "The linked Jira project is no longer reachable. Unlink and pick it again to resume creating issues.",
  stale_issue_type:
    "Jira rejected the issue type for this link, usually because a required field was added. Unlink and pick the issue type again.",
  webhook_refresh_failed:
    "Faster Fixes could not renew this link's Jira webhook, so status changes made in Jira are not syncing back. It is retried weekly; unlink and relink to fix it now.",
};

const FALLBACK_LINK_HEALTH_MESSAGE =
  "This link needs attention. Unlink and pick the Jira project again to clear this warning.";

type LinkedJiraProjectViewProps = {
  projectId: string;
  link: NonNullable<GetProjectJiraLinkOutput>;
  siteUrl: string;
};

export function LinkedJiraProjectView({
  projectId,
  link,
  siteUrl,
}: LinkedJiraProjectViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {link.linkHealthIssue && (
        <Alert variant="destructive">
          <AlertDescription>
            {LINK_HEALTH_MESSAGES[link.linkHealthIssue] ??
              FALLBACK_LINK_HEALTH_MESSAGE}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1">
        <a
          href={`${siteUrl.replace(/\/$/, "")}/browse/${link.jiraProjectKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {link.jiraProjectKey} · {link.jiraProjectName}
          <ExternalLink className="ml-1 inline size-3" />
        </a>
        <p className="text-sm text-muted-foreground">
          Issue type: {link.issueTypeName}
        </p>
      </div>

      <AutoCreateIssuesSwitch
        projectId={projectId}
        checked={link.autoCreateIssues}
      />

      <DefaultLabelsEditor projectId={projectId} labels={link.defaultLabels} />

      <UnlinkJiraProjectButton projectId={projectId} />
    </div>
  );
}
