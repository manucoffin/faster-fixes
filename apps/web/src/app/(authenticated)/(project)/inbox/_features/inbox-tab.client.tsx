"use client";

import { useActiveMember, useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { AlertCircle, Archive, Inbox } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ArchiveTab } from "./archive/archive-tab.client";
import { FeedbackDetailPanel } from "./feedback-panel/feedback-detail-panel.client";
import { FeedbackFilters } from "./filters/feedback-filters.client";
import type { GetFeedbackOutput } from "./get-feedback.trpc.query";
import { KanbanBoard } from "./kanban/kanban-board.client";

type InboxTabProps = {
  projectId: string;
};

export function InboxTab({ projectId }: InboxTabProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: activeOrg } = useActiveOrganization();
  const { data: activeMember } = useActiveMember();

  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("board"),
  );
  const [pageUrlFilter, setPageUrlFilter] = useQueryState("pageUrl");
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("newest"),
  );
  const [selectedFeedbackId, setSelectedFeedbackId] =
    useQueryState("feedbackId");

  const feedbackQuery = useQuery(
    trpc.authenticated.projects.feedback.list.queryOptions({ projectId }),
  );

  const pageUrlsQuery = useQuery(
    trpc.authenticated.projects.feedback.distinctPageUrls.queryOptions({
      projectId,
    }),
  );

  const feedbackQueryKey = trpc.authenticated.projects.feedback.list.queryKey({
    projectId,
  });

  const updateStatusMutation = useMutation(
    trpc.authenticated.projects.feedback.updateStatus.mutationOptions({
      onMutate: async ({ feedbackId, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: GetFeedbackOutput | undefined) =>
            old?.map((f) => (f.id === feedbackId ? { ...f, status } : f)),
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(feedbackQueryKey, context.previous);
        }
        toast.error("Failed to update status.");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey });
      },
    }),
  );

  const bulkUpdateStatusMutation = useMutation(
    trpc.authenticated.projects.feedback.bulkUpdateStatus.mutationOptions({
      onMutate: async ({ feedbackIds, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);
        const idSet = new Set(feedbackIds);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: GetFeedbackOutput | undefined) =>
            old?.map((f) => (idSet.has(f.id) ? { ...f, status } : f)),
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(feedbackQueryKey, context.previous);
        }
        toast.error("Failed to update status.");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey });
      },
    }),
  );

  const updateAssigneeMutation = useMutation(
    trpc.authenticated.projects.feedback.updateAssignee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey });
      },
      onError: () => {
        toast.error("Failed to update assignee.");
      },
    }),
  );

  const orgMembers = React.useMemo(() => {
    const members = (activeOrg as Record<string, unknown> | undefined)
      ?.members as
      | Array<{
          id: string;
          userId: string;
          role: string;
          user: { id: string; name: string; email: string; image?: string };
        }>
      | undefined;

    return (
      members?.map((m) => ({
        id: m.id,
        name: m.user.name || m.user.email,
        image: m.user.image ?? null,
      })) ?? []
    );
  }, [activeOrg]);

  const currentMemberId =
    ((activeMember as Record<string, unknown> | undefined)?.id as
      | string
      | undefined) ?? null;

  const selectedFeedback = React.useMemo(
    () => feedbackQuery.data?.find((f) => f.id === selectedFeedbackId) ?? null,
    [feedbackQuery.data, selectedFeedbackId],
  );

  function handleStatusChange(feedbackId: string, status: string) {
    updateStatusMutation.mutate({
      feedbackId,
      status: status as "new" | "in_progress" | "resolved" | "closed",
    });
  }

  function handleBulkStatusChange(feedbackIds: string[], status: string) {
    bulkUpdateStatusMutation.mutate({
      feedbackIds,
      status: status as "new" | "in_progress" | "resolved" | "closed",
    });
  }

  function handleAssigneeChange(feedbackId: string, assigneeId: string | null) {
    updateAssigneeMutation.mutate({ feedbackId, assigneeId });
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={view} onValueChange={setView}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="board">
              <Inbox className="mr-1.5 size-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="archive">
              <Archive className="mr-1.5 size-4" />
              Archive
            </TabsTrigger>
          </TabsList>

          {view === "board" && (
            <FeedbackFilters
              pageUrls={pageUrlsQuery.data ?? []}
              selectedPageUrl={pageUrlFilter}
              onPageUrlChange={setPageUrlFilter}
              sort={sort}
              onSortChange={setSort}
            />
          )}
        </div>

        <TabsContent value="board" className="mt-4">
          {matchQueryStatus(feedbackQuery, {
            Loading: (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ),
            Errored: (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertCircle />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load feedback</EmptyTitle>
                  <EmptyDescription>
                    Something went wrong. Please try again later.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ),
            Empty: (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox />
                  </EmptyMedia>
                  <EmptyTitle>No feedback yet</EmptyTitle>
                  <EmptyDescription>
                    Feedback submitted by reviewers will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ),
            Success: ({ data: feedback }) => (
              <KanbanBoard
                feedback={feedback}
                pageUrlFilter={pageUrlFilter}
                sort={sort}
                onStatusChange={handleStatusChange}
                onBulkStatusChange={handleBulkStatusChange}
                onSelectFeedback={(id) => setSelectedFeedbackId(id)}
              />
            ),
          })}
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <ArchiveTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      <FeedbackDetailPanel
        feedback={selectedFeedback}
        open={!!selectedFeedbackId}
        onOpenChange={(open) => {
          if (!open) setSelectedFeedbackId(null);
        }}
        onStatusChange={handleStatusChange}
        onAssigneeChange={handleAssigneeChange}
        orgMembers={orgMembers}
        currentMemberId={currentMemberId}
      />
    </div>
  );
}
