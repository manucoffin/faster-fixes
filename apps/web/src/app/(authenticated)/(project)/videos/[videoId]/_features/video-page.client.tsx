"use client";

import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { useActiveProject } from "@/app/_domains/project/active-project/active-project-provider.client";
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
import { AlertCircle, FolderOpen } from "lucide-react";

import { VideoReview } from "./video-review.client";

type VideoPageProps = {
  videoId: string;
};

export function VideoPage({ videoId }: VideoPageProps) {
  const { activeProject, isPending } = useActiveProject();
  const trpc = useTRPC();

  const videoQuery = useQuery(
    trpc.authenticated.projects.video.get.queryOptions({ videoId }),
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // The detail Sheet's Status and Assignee controls act on the active Project.
  if (!activeProject) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>Select a project</EmptyTitle>
          <EmptyDescription>
            Choose a project from the sidebar to see its videos.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <DashboardPageContent
      breadcrumbs={[
        { label: "Videos", link: "/videos" },
        { label: videoQuery.data?.title ?? "Video" },
      ]}
    >
      {matchQueryStatus(videoQuery, {
        Loading: (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-7 w-64" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ),
        Errored: (error) => (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Failed to load video</EmptyTitle>
              <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Empty: (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Video not found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ),
        Success: ({ data: video }) => (
          <div className="flex flex-col gap-6">
            {/* The header leaves room for the Video actions. */}
            <header className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="truncate text-xl font-semibold">{video.title}</h1>
            </header>
            <VideoReview
              video={video}
              onPlaybackError={() => void videoQuery.refetch()}
            />
          </div>
        ),
      })}
    </DashboardPageContent>
  );
}
