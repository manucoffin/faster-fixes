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
