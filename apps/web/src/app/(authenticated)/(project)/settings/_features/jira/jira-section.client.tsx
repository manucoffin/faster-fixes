"use client";

import { usePlanGate } from "@/app/_domains/subscription/use-plan-gate";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { JiraProjectPicker } from "./link-project/jira-project-picker.client";
import { LinkedJiraProjectView } from "./linked-jira-project-view.client";

type JiraSectionProps = {
  projectId: string;
};

export function JiraSection({ projectId }: JiraSectionProps) {
  const { data: activeOrg } = useActiveOrganization();
  const { canAccess } = usePlanGate();

  if (!canAccess("jiraIntegration")) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Jira integration is available on paid plans.
        </p>
        <Button className="w-fit" asChild>
          <a href="/account/billing">Upgrade your plan</a>
        </Button>
      </div>
    );
  }

  return <JiraSectionInner orgId={activeOrg?.id} projectId={projectId} />;
}

type JiraSectionInnerProps = {
  orgId: string | undefined;
  projectId: string;
};

function JiraSectionInner({ orgId, projectId }: JiraSectionInnerProps) {
  const trpc = useTRPC();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.jira.getInstallation.queryOptions(
      undefined,
      { enabled: !!orgId },
    ),
  );

  return matchQueryStatus(installationQuery, {
    Loading: <Skeleton className="h-16 w-full" />,
    Errored: (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load Jira integration. Try refreshing the page.
        </AlertDescription>
      </Alert>
    ),
    Empty: (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Connect a Jira site in organization settings to link a Jira project.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">Go to integrations</a>
        </Button>
      </div>
    ),
    Success: ({ data: installation }) =>
      // A site that was never finalized or lost its authorization cannot serve
      // the pickers, so send the maintainer back to the integrations page.
      installation.healthState === "connected" ? (
        <LinkOrPickJiraProject
          projectId={projectId}
          siteUrl={installation.siteUrl}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            The Jira connection needs attention before a Jira project can be
            linked.
          </p>
          <Button variant="link" className="w-fit px-0" asChild>
            <a href="/integrations">Go to integrations</a>
          </Button>
        </div>
      ),
  });
}

type LinkOrPickJiraProjectProps = {
  projectId: string;
  siteUrl: string;
};

function LinkOrPickJiraProject({
  projectId,
  siteUrl,
}: LinkOrPickJiraProjectProps) {
  const trpc = useTRPC();

  const linkQuery = useQuery(
    trpc.authenticated.projects.jira.getLink.queryOptions({ projectId }),
  );

  const jiraProjectsQuery = useQuery(
    trpc.authenticated.projects.jira.listProjects.queryOptions(
      { projectId },
      { enabled: !linkQuery.data },
    ),
  );

  return matchQueryStatus(linkQuery, {
    Loading: <Skeleton className="h-32 w-full" />,
    Errored: (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load the Jira project link. Try refreshing the page.
        </AlertDescription>
      </Alert>
    ),
    Success: ({ data: link }) =>
      link ? (
        <LinkedJiraProjectView
          projectId={projectId}
          link={link}
          siteUrl={siteUrl}
        />
      ) : (
        <JiraProjectPicker
          projectId={projectId}
          jiraProjects={jiraProjectsQuery.data ?? []}
        />
      ),
  });
}
