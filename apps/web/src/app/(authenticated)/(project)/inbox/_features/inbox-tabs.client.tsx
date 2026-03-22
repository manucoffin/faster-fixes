"use client";

import { useActiveProject } from "@/app/_features/project/active-project-provider.client";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { AlertCircle, Archive, Inbox } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { ArchiveTab } from "./archive/archive-tab.client";
import { FeedbackDetailPanel } from "./feedback-panel/feedback-detail-panel.client";
import { FeedbackFilters } from "./filters/feedback-filters.client";
import { KanbanBoard } from "./kanban/kanban-board.client";

export function InboxTabs() {
  const { activeProject } = useActiveProject();
  const projectId = activeProject!.id;
  const trpc = useTRPC();

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

  const selectedFeedback = React.useMemo(
    () => feedbackQuery.data?.find((f) => f.id === selectedFeedbackId) ?? null,
    [feedbackQuery.data, selectedFeedbackId],
  );

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={view} onValueChange={setView}>
        <div className="flex flex-wrap items-center justify-between gap-2">
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
              <div className="flex flex-col gap-4">
                <Skeleton className="h-9 w-full rounded-full lg:hidden" />
                <div className="hidden gap-4 lg:grid lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 lg:hidden">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
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
                onSelectFeedback={(id) => setSelectedFeedbackId(id)}
              />
            ),
          })}
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <ArchiveTab />
        </TabsContent>
      </Tabs>

      <FeedbackDetailPanel
        feedback={selectedFeedback}
        open={!!selectedFeedbackId}
        onOpenChange={(open) => {
          if (!open) setSelectedFeedbackId(null);
        }}
      />
    </div>
  );
}
