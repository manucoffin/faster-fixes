"use client";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { ExternalLink } from "lucide-react";
import type { GetProjectLinearLinkOutput } from "./get-project-linear-link.trpc.query";
import { UnlinkTeamButton } from "./unlink-team/unlink-team-button.client";
import { AutoCreateIssuesSwitch } from "./update-link/auto-create-issues-switch.client";

type LinkedTeamViewProps = {
  projectId: string;
  link: NonNullable<GetProjectLinearLinkOutput>;
  workspaceUrlKey: string;
};

export function LinkedTeamView({
  projectId,
  link,
  workspaceUrlKey,
}: LinkedTeamViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {link.linkHealthIssue && (
        <Alert>
          <AlertDescription>
            Some Linear settings reference deleted states or labels. Re-pick
            them in the team settings on Linear, then save again to clear this
            warning.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <a
          href={`https://linear.app/${workspaceUrlKey}/team/${link.teamKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {link.teamKey} · {link.teamName}
          <ExternalLink className="ml-1 inline size-3" />
        </a>
      </div>

      <AutoCreateIssuesSwitch
        projectId={projectId}
        checked={link.autoCreateIssues}
      />

      <UnlinkTeamButton projectId={projectId} />
    </div>
  );
}
