"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { RepoPicker } from "./link-repo/repo-picker.client";
import { LinkedRepoView } from "./linked-repo-view.client";

type GitHubSectionProps = {
  projectId: string;
};

export function GitHubSection({ projectId }: GitHubSectionProps) {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.github.getInstallation.queryOptions(
      undefined,
      { enabled: !!activeOrg?.id },
    ),
  );

  const linkQuery = useQuery(
    trpc.authenticated.projects.github.getLink.queryOptions(
      { projectId },
      { enabled: !!projectId },
    ),
  );

  const reposQuery = useQuery(
    trpc.authenticated.projects.github.listRepos.queryOptions(undefined, {
      enabled: !!installationQuery.data && !linkQuery.data,
    }),
  );

  const installation = installationQuery.data;
  const link = linkQuery.data;
  const repos = reposQuery.data ?? [];

  if (!installation) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Connect GitHub in organization settings to enable issue creation.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">Go to integrations</a>
        </Button>
      </div>
    );
  }

  if (link) {
    return <LinkedRepoView projectId={projectId} link={link} />;
  }

  return <RepoPicker projectId={projectId} repos={repos} />;
}
