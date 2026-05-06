"use client";

import { usePlanGate } from "@/app/_features/subscription/use-plan-gate";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { TeamPicker } from "./link-team/team-picker.client";
import { LinkedTeamView } from "./linked-team-view.client";

type LinearSectionProps = {
  projectId: string;
};

export function LinearSection({ projectId }: LinearSectionProps) {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();
  const { canAccess } = usePlanGate();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.linear.getInstallation.queryOptions(
      undefined,
      { enabled: !!activeOrg?.id },
    ),
  );

  const linkQuery = useQuery(
    trpc.authenticated.projects.linear.getLink.queryOptions(
      { projectId },
      { enabled: !!projectId },
    ),
  );

  const teamsQuery = useQuery(
    trpc.authenticated.projects.linear.listTeams.queryOptions(undefined, {
      enabled: !!installationQuery.data && !linkQuery.data,
    }),
  );

  const installation = installationQuery.data;
  const link = linkQuery.data;
  const teams = teamsQuery.data ?? [];

  if (!canAccess("linearIntegration")) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Linear integration is available on paid plans.
        </p>
        <Button className="w-fit" asChild>
          <a href="/account/billing">Upgrade your plan</a>
        </Button>
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Connect Linear in organization settings to link a team.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">Go to integrations</a>
        </Button>
      </div>
    );
  }

  if (link) {
    return (
      <LinkedTeamView
        projectId={projectId}
        link={link}
        workspaceUrlKey={installation.linearOrgUrlKey}
      />
    );
  }

  return <TeamPicker projectId={projectId} teams={teams} />;
}
