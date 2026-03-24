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
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertTriangle, KeyRound } from "lucide-react";
import { Fragment } from "react";
import { AgentTokenItem } from "./agent-token-item.client";
import { CreateAgentTokenDialog } from "./create-agent-token-dialog.client";

export function AgentTokensSection() {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const tokensQuery = useQuery(
    trpc.authenticated.integrations.agentToken.list.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
  );

  return matchQueryStatus(tokensQuery, {
    Loading: (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    ),
    Errored: (
      <Empty className="border-none p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle />
          </EmptyMedia>
          <EmptyTitle>Failed to load tokens</EmptyTitle>
          <EmptyDescription>
            An error occurred while loading your agent tokens. Try refreshing
            the page.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Empty: (
      <Empty className="border-none p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRound />
          </EmptyMedia>
          <EmptyTitle>No agent tokens</EmptyTitle>
          <EmptyDescription>
            Create a token to authenticate the Faster Fixes MCP server.
          </EmptyDescription>
        </EmptyHeader>
        <CreateAgentTokenDialog />
      </Empty>
    ),
    Success: ({ data: tokens }) => (
      <div className="flex flex-col">
        {tokens.map((token, index) => (
          <Fragment key={token.id}>
            {index > 0 && <Separator />}
            <AgentTokenItem token={token} />
          </Fragment>
        ))}
        <div className="pt-3">
          <CreateAgentTokenDialog />
        </div>
      </div>
    ),
  });
}
