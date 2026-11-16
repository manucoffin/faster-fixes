"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ExternalLink } from "lucide-react";
import type { GetProjectTrelloLinkOutput } from "../../_services/get-project-trello-link";
import { UnlinkTrelloBoardButton } from "./unlink-board/unlink-trello-board-button.client";
import { AutoCreateIssuesSwitch } from "./update-link/auto-create-issues-switch.client";
import { DefaultLabelsEditor } from "./update-link/default-labels-editor.client";
import { ListMappingEditor } from "./update-link/list-mapping-editor.client";

// Keyed on ProjectTrelloLink.linkHealthIssue. Each reason names its own remedy:
// a stale list needs a remap, a closed or unreachable board is fixed in Trello.
const LINK_HEALTH_MESSAGES: Record<string, string> = {
  stale_list:
    "A mapped list was archived or deleted in Trello. Card creation is paused until each status is mapped to an open list.",
  board_closed:
    "This Trello board is closed. Card creation is paused until the board is reopened in Trello, or you unlink it and link another board.",
  board_unreachable:
    "This Trello board is no longer reachable by the connected Trello member. Card creation is paused until their access is restored, or you unlink it and link another board.",
};

const FALLBACK_LINK_HEALTH_MESSAGE =
  "This Trello board link needs attention. Card creation is paused until it is fixed.";

type LinkedTrelloBoardViewProps = {
  projectId: string;
  link: NonNullable<GetProjectTrelloLinkOutput>;
};

export function LinkedTrelloBoardView({
  projectId,
  link,
}: LinkedTrelloBoardViewProps) {
  const trpc = useTRPC();

  // List names are read live rather than stored, so a list renamed in Trello
  // shows its current name.
  const listsQuery = useQuery(
    trpc.authenticated.projects.trello.listBoardLists.queryOptions({
      projectId,
      boardId: link.boardId,
    }),
  );

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

      <a
        href={link.boardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium hover:underline"
      >
        {link.boardName}
        <ExternalLink className="ml-1 inline size-3" />
      </a>

      {matchQueryStatus(listsQuery, {
        Loading: <Skeleton className="h-20 w-full" />,
        Errored: (error) => (
          <Alert variant="destructive">
            <AlertTitle>Failed to load the board lists</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        ),
        Success: ({ data: lists }) => (
          <ListMappingEditor
            projectId={projectId}
            link={link}
            lists={lists ?? []}
          />
        ),
      })}

      <AutoCreateIssuesSwitch
        projectId={projectId}
        checked={link.autoCreateIssues}
      />

      <DefaultLabelsEditor
        projectId={projectId}
        labelIds={link.defaultLabelIds}
      />

      <UnlinkTrelloBoardButton projectId={projectId} />
    </div>
  );
}
