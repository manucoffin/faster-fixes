"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
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
import { AlertCircle, SquarePlay } from "lucide-react";

import { VideoUsageLine } from "./video-usage-line.client";
import { VideosTable } from "./videos-table.client";

type VideosListProps = {
  projectId: string;
};

const SKELETON_ROWS = 3;

// The header row is left for the Upload button.
export function VideosList({ projectId }: VideosListProps) {
  const trpc = useTRPC();

  const videosQuery = useQuery(
    trpc.authenticated.projects.video.list.queryOptions({ projectId }),
  );

  return (
    <div className="flex flex-col gap-8">
      <VideoUsageLine projectId={projectId} />
      {matchQueryStatus(videosQuery, {
        Loading: (
          <div className="flex flex-col gap-2">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ),
        Errored: (error) => (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Failed to load videos</EmptyTitle>
              <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Empty: (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SquarePlay />
              </EmptyMedia>
              <EmptyTitle>No videos yet</EmptyTitle>
              <EmptyDescription>
                Upload a video to collect timed feedback from your clients.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Success: ({ data: videos }) => <VideosTable videos={videos} />,
      })}
    </div>
  );
}
