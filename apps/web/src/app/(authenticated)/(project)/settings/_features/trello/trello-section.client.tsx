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
import { TrelloBoardPicker } from "./link-board/trello-board-picker.client";
import { LinkedTrelloBoardView } from "./linked-trello-board-view.client";

type TrelloSectionProps = {
  projectId: string;
};

export function TrelloSection({ projectId }: TrelloSectionProps) {
  const { data: activeOrg } = useActiveOrganization();
  const { canAccess } = usePlanGate();

  if (!canAccess("trelloIntegration")) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Trello integration is available on paid plans.
        </p>
        <Button className="w-fit" asChild>
          <a href="/account/billing">Upgrade your plan</a>
        </Button>
      </div>
    );
  }

  return <TrelloSectionInner orgId={activeOrg?.id} projectId={projectId} />;
}

type TrelloSectionInnerProps = {
  orgId: string | undefined;
  projectId: string;
};

function TrelloSectionInner({ orgId, projectId }: TrelloSectionInnerProps) {
  const trpc = useTRPC();

  const installationQuery = useQuery(
    trpc.authenticated.integrations.trello.getInstallation.queryOptions(
      undefined,
      { enabled: !!orgId },
    ),
  );

  return matchQueryStatus(installationQuery, {
    Loading: <Skeleton className="h-16 w-full" />,
    Errored: (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load Trello integration. Try refreshing the page.
        </AlertDescription>
      </Alert>
    ),
    Empty: (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Connect Trello in organization settings to link a Trello board.
        </p>
        <Button variant="link" className="w-fit px-0" asChild>
          <a href="/integrations">Go to integrations</a>
        </Button>
      </div>
    ),
    Success: ({ data: installation }) =>
      // A grant Trello refused cannot serve the pickers, so send the
      // maintainer back to the integrations page to reconnect.
      installation.healthState === "connected" ? (
        <LinkOrPickTrelloBoard projectId={projectId} />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            The Trello connection needs attention before a Trello board can be
            linked.
          </p>
          <Button variant="link" className="w-fit px-0" asChild>
            <a href="/integrations">Go to integrations</a>
          </Button>
        </div>
      ),
  });
}

type LinkOrPickTrelloBoardProps = {
  projectId: string;
};

function LinkOrPickTrelloBoard({ projectId }: LinkOrPickTrelloBoardProps) {
  const trpc = useTRPC();

  const linkQuery = useQuery(
    trpc.authenticated.projects.trello.getLink.queryOptions({ projectId }),
  );

  const boardsQuery = useQuery(
    trpc.authenticated.projects.trello.listBoards.queryOptions(
      { projectId },
      { enabled: linkQuery.data === null },
    ),
  );

  return matchQueryStatus(linkQuery, {
    Loading: <Skeleton className="h-32 w-full" />,
    Errored: (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load the Trello board link. Try refreshing the page.
        </AlertDescription>
      </Alert>
    ),
    Success: ({ data: link }) =>
      link ? (
        <LinkedTrelloBoardView projectId={projectId} link={link} />
      ) : (
        matchQueryStatus(boardsQuery, {
          Loading: <Skeleton className="h-32 w-full" />,
          Errored: (error) => (
            <Alert variant="destructive">
              <AlertTitle>Failed to load your Trello boards</AlertTitle>
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          ),
          Empty: (
            <p className="text-sm text-muted-foreground">
              The connected Trello account has no open board. Create one in
              Trello, then come back to link it.
            </p>
          ),
          Success: ({ data: boards }) => (
            <TrelloBoardPicker projectId={projectId} boards={boards} />
          ),
        })
      ),
  });
}
