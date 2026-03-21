"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { AlertCircle, Users } from "lucide-react";
import * as React from "react";

import { CreateReviewerDialog } from "./create/create-reviewer-dialog.client";
import { NewShareUrlBanner } from "./new-share-url-banner.client";
import { ReviewersTable } from "./reviewers-table.client";

type ReviewersTabProps = {
  projectId: string;
};

const TABLE_COLUMNS = 5;
const SKELETON_ROWS = 3;

export function ReviewersTab({ projectId }: ReviewersTabProps) {
  const trpc = useTRPC();
  const [newShareUrl, setNewShareUrl] = React.useState<string | null>(null);

  const reviewersQuery = useQuery(
    trpc.authenticated.projects.reviewer.list.queryOptions({ projectId }),
  );

  return (
    <div className="flex flex-col gap-8">
      {newShareUrl && <NewShareUrlBanner shareUrl={newShareUrl} />}

      {matchQueryStatus(reviewersQuery, {
        Loading: (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Share link</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: TABLE_COLUMNS }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ),
        Errored: (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Failed to load reviewers</EmptyTitle>
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
                <Users />
              </EmptyMedia>
              <EmptyTitle>No reviewers yet</EmptyTitle>
              <EmptyDescription>
                Add your first client to start collecting feedback.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateReviewerDialog
                projectId={projectId}
                onCreated={setNewShareUrl}
              />
            </EmptyContent>
          </Empty>
        ),
        Success: ({ data: reviewers }) => (
          <>
            <div className="flex justify-end">
              <CreateReviewerDialog
                projectId={projectId}
                onCreated={setNewShareUrl}
              />
            </div>
            <ReviewersTable projectId={projectId} reviewers={reviewers} />
          </>
        ),
      })}
    </div>
  );
}
