"use client";

import { DataTable } from "@/app/_components/data-table.client";
import { DataTableColumnHeader } from "@/app/_components/data-table-column-header.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle } from "lucide-react";
import * as React from "react";
import { getPageAfterRemoval } from "../../_helpers/archive-deletion";
import type { ListArchivedFeedbackOutput } from "../../_services/list-archived-feedback";
import { ColumnSelectCheckbox } from "../kanban/column-select-checkbox.client";
import { ArchiveSelectionToolbar } from "./archive-selection-toolbar.client";
import { ArchivedFeedbackActionsDropdown } from "./archived-feedback-actions-dropdown.client";
import { useDeleteArchivedFeedback } from "./use-delete-archived-feedback";
import { useRestoreArchivedFeedback } from "./use-restore-archived-feedback";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Archive } from "lucide-react";

type ArchivedItem = ListArchivedFeedbackOutput["items"][number];

const PAGE_SIZE = 20;

type ArchiveTabProps = {
  projectId: string;
};

export function ArchiveTab({ projectId }: ArchiveTabProps) {
  const trpc = useTRPC();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [sorting, setSorting] = React.useState<
    Array<{ id: string; desc: boolean }>
  >([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Selection covers the visible page only, so any change of view drops it
  // rather than letting a delete reach rows that are no longer on screen.
  const clearSelection = () =>
    setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()));

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    clearSelection();
  };
  const changeSearch = (nextSearch: string) => {
    setSearch(nextSearch);
    clearSelection();
  };
  const changeSorting = (nextSorting: Array<{ id: string; desc: boolean }>) => {
    setSorting(nextSorting);
    clearSelection();
  };

  const toggleSelected = (feedbackId: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(feedbackId)) {
        next.delete(feedbackId);
      } else {
        next.add(feedbackId);
      }
      return next;
    });

  const togglePageSelected = (pageIds: string[]) =>
    setSelectedIds((prev) =>
      pageIds.every((id) => prev.has(id)) ? new Set() : new Set(pageIds),
    );

  const sortBy =
    sorting[0]?.id === "createdAt"
      ? ("createdAt" as const)
      : ("updatedAt" as const);
  const sortOrder =
    sorting[0]?.desc === false ? ("asc" as const) : ("desc" as const);

  const archiveQuery = useQuery(
    trpc.authenticated.projects.feedback.listArchived.queryOptions({
      projectId,
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      sortBy,
      sortOrder,
    }),
  );

  const totalCount = archiveQuery.data?.totalCount;

  // Deleted or restored, the rows leave the archive the same way.
  const handleRemoved = (removed: number) => {
    setSelectedIds(new Set());
    if (totalCount !== undefined) {
      setPage((current) =>
        getPageAfterRemoval({
          page: current,
          pageSize: PAGE_SIZE,
          totalCount,
          removed,
        }),
      );
    }
  };

  const deletion = useDeleteArchivedFeedback({
    projectId,
    onDeleted: handleRemoved,
  });
  const restoration = useRestoreArchivedFeedback({
    projectId,
    onRestored: handleRemoved,
  });
  const isPending = deletion.isPending || restoration.isPending;

  const columns: ColumnDef<ArchivedItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <ColumnSelectCheckbox
          columnTitle="feedback on this page"
          itemIds={table.getRowModel().rows.map((row) => row.original.id)}
          selectedIds={selectedIds}
          onToggle={() =>
            togglePageSelected(
              table.getRowModel().rows.map((row) => row.original.id),
            )
          }
          disabled={isPending}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelected(row.original.id)}
          disabled={isPending}
          aria-label="Select feedback"
        />
      ),
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) => (
        <p className="max-w-[300px] truncate text-sm">{row.original.comment}</p>
      ),
    },
    {
      accessorKey: "pageUrl",
      header: "Page URL",
      cell: ({ row }) => {
        let displayUrl = row.original.pageUrl;
        try {
          const url = new URL(row.original.pageUrl);
          displayUrl = url.hostname + url.pathname.replace(/\/$/, "");
        } catch {
          // Not a parseable URL: show it as stored
        }
        return (
          <p
            className="max-w-[300px] truncate text-xs text-muted-foreground"
            title={row.original.pageUrl}
          >
            {displayUrl}
          </p>
        );
      },
    },
    {
      accessorKey: "reviewer",
      header: "Reviewer",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.reviewer.name}</span>
      ),
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      cell: ({ row }) => {
        const assignee = row.original.assignee;
        if (!assignee) {
          return (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarImage
                src={assignee.image ? resolveS3Url(assignee.image) : undefined}
                className="object-cover"
              />
              <AvatarFallback className="text-[10px]">
                {assignee.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{assignee.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Archived" />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.updatedAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ArchivedFeedbackActionsDropdown
          onRestore={() => restoration.restoreOne(row.original.id)}
          onDelete={() => deletion.deleteOne(row.original.id)}
          disabled={isPending}
        />
      ),
    },
  ];

  return matchQueryStatus(archiveQuery, {
    Loading: (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    Errored: (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Failed to load archive</EmptyTitle>
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
            <Archive />
          </EmptyMedia>
          <EmptyTitle>No archived feedback</EmptyTitle>
          <EmptyDescription>
            Feedback items moved to archive will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Success: ({ data }) => (
      <DataTable
        columns={columns}
        data={data.items}
        pageCount={data.pageCount || 1}
        currentPage={page}
        setCurrentPage={changePage}
        search={search}
        setSearch={changeSearch}
        searchInputPlaceholder="Search by comment..."
        isLoading={archiveQuery.isFetching}
        onSortingChange={changeSorting}
        selectionActions={
          selectedIds.size > 0 && (
            <ArchiveSelectionToolbar
              selectedCount={selectedIds.size}
              pageItemCount={data.items.length}
              onRestore={() => restoration.restoreMany(Array.from(selectedIds))}
              onDelete={() => deletion.deleteMany(Array.from(selectedIds))}
              onClearSelection={clearSelection}
              disabled={isPending}
            />
          )
        }
      />
    ),
  });
}
