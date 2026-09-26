"use client";

import { usePlanGate } from "@/app/_domains/subscription";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { RepoPicker } from "./link-repo/repo-picker.client";
import { LinkedRepoView } from "./linked-repo-view.client";

type GitHubSectionProps = {
  projectId: string;
};

export function GitHubSection({ projectId }: GitHubSectionProps) {
  const { data: activeOrg } = useActiveOrganization();
  const { canAccess } = usePlanGate();

  if (!canAccess("githubIntegration")) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          GitHub integration is available on paid plans.
        </p>
        <Button className="w-fit" asChild>
          <a href="/account/billing">Upgrade your plan</a>
        </Button>
      </div>
    );
  }

  return <GitHubSectionInner orgId={activeOrg?.id} projectId={projectId} />;
}

type GitHubSectionInnerProps = {
  orgId: string | undefined;
  projectId: string;
};

function GitHubSectionInner({ orgId, projectId }: GitHubSectionInnerProps) {
  const trpc = useTRPC();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.github.getInstallation.queryOptions(
      undefined,
      { enabled: !!orgId },
    ),
  );

  return matchQueryStatus(installationQuery, {
    Loading: <Skeleton className="h-16 w-full" />,
    Errored: (error) => (
      <Alert variant="destructive">
        <AlertTitle>Failed to load the GitHub integration</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    Empty: (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Connect GitHub in organization settings to enable issue creation.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">Go to integrations</a>
        </Button>
      </div>
    ),
    Success: () => <LinkOrPickRepo projectId={projectId} />,
  });
}

type LinkOrPickRepoProps = {
  projectId: string;
};

function LinkOrPickRepo({ projectId }: LinkOrPickRepoProps) {
  const trpc = useTRPC();

  const linkQuery = useQuery(
    trpc.authenticated.projects.github.getLink.queryOptions(
      { projectId },
      { enabled: !!projectId },
    ),
  );

  const reposQuery = useQuery(
    trpc.authenticated.projects.github.listRepos.queryOptions(undefined, {
      enabled: !linkQuery.data,
    }),
  );

  return matchQueryStatus(linkQuery, {
    Loading: <Skeleton className="h-32 w-full" />,
    Errored: (error) => (
      <Alert variant="destructive">
        <AlertTitle>Failed to load the repository link</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    Success: ({ data: link }) =>
      link ? (
        <LinkedRepoView projectId={projectId} link={link} />
      ) : (
        matchQueryStatus(reposQuery, {
          Loading: <Skeleton className="h-32 w-full" />,
          Errored: (error) => (
            <Alert variant="destructive">
              <AlertTitle>Failed to load your repositories</AlertTitle>
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          ),
          Success: ({ data: repos }) => (
            <RepoPicker projectId={projectId} repos={repos ?? []} />
          ),
        })
      ),
  });
}
