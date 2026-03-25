"use client";

import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { ExternalLink } from "lucide-react";
import type { GetProjectGitHubLinkOutput } from "./get-project-link.trpc.query";
import { UnlinkRepoButton } from "./unlink-repo/unlink-repo-button.client";
import { AutoCreateIssuesSwitch } from "./update-link/auto-create-issues-switch.client";

type LinkedRepoViewProps = {
  projectId: string;
  link: NonNullable<GetProjectGitHubLinkOutput>;
};

export function LinkedRepoView({ projectId, link }: LinkedRepoViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <GithubIcon className="text-muted-foreground size-4" />
        <a
          href={`https://github.com/${link.repoFullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {link.repoFullName}
          <ExternalLink className="ml-1 inline size-3" />
        </a>
      </div>

      <AutoCreateIssuesSwitch
        projectId={projectId}
        checked={link.autoCreateIssues}
      />

      <UnlinkRepoButton projectId={projectId} />
    </div>
  );
}
