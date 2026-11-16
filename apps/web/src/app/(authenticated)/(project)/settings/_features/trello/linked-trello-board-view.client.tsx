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
import type { ListTrelloBoardListsOutput } from "../../_services/list-trello-board-lists";

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
          <MappedLists link={link} lists={lists ?? []} />
        ),
      })}
    </div>
  );
}

type MappedListsProps = {
  link: NonNullable<GetProjectTrelloLinkOutput>;
  lists: ListTrelloBoardListsOutput;
};

function MappedLists({ link, lists }: MappedListsProps) {
  const rows = [
    { status: "New", listId: link.newListId },
    { status: "In Progress", listId: link.inProgressListId },
    { status: "Resolved", listId: link.resolvedListId },
  ];

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map(({ status, listId }) => (
        <div key={status} className="contents">
          <dt className="text-muted-foreground">{status}</dt>
          <dd>{describeList(lists, listId)}</dd>
        </div>
      ))}
    </dl>
  );
}

function describeList(
  lists: ListTrelloBoardListsOutput,
  listId: string | null,
) {
  if (!listId) return "Not mapped";
  return lists.find((list) => list.id === listId)?.name ?? "List not found";
}
