"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertTriangle } from "lucide-react";
import { SlackConnected } from "./slack-connected.client";
import { SlackNotConnected } from "./slack-not-connected.client";

export function SlackIntegrationSection() {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.slack.getInstallation.queryOptions(
      undefined,
      { enabled: !!activeOrg?.id },
    ),
  );

  return matchQueryStatus(installationQuery, {
    Loading: <Skeleton className="h-16 w-full" />,
    Errored: (
      <Empty className="border-none p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle />
          </EmptyMedia>
          <EmptyTitle>Failed to load integration</EmptyTitle>
          <EmptyDescription>
            An error occurred while loading the Slack integration. Try
            refreshing the page.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Empty: <SlackNotConnected />,
    Success: ({ data: installation }) => (
      <SlackConnected installation={installation} />
    ),
  });
}
