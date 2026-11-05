"use client";

import { AppLogo } from "@/app/_components/app-logo";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { ReactNode } from "react";
import { ReviewLinkNotFound } from "../../_components/review-link-not-found";
import { ReviewerChip } from "../../_components/reviewer-chip";
import { ReviewWorkspace } from "./review-workspace.client";
import { useReviewPageQuery } from "./use-review-page-query";

// A failing player refetches the signed URL, but not more often than this, so
// a file that cannot play does not loop on the API.
const PLAYBACK_RETRY_INTERVAL_MS = 30 * 1000;

type VideoReviewProps = {
  secret: string;
  initialFeedbackId: string | null;
};

export function VideoReview({ secret, initialFeedbackId }: VideoReviewProps) {
  const reviewPageQuery = useReviewPageQuery(secret);

  function handlePlaybackError() {
    const sinceLastRead = Date.now() - reviewPageQuery.dataUpdatedAt;
    if (sinceLastRead >= PLAYBACK_RETRY_INTERVAL_MS) {
      void reviewPageQuery.refetch();
    }
  }

  return matchQueryStatus(reviewPageQuery, {
    Loading: (
      <ReviewShell
        title={<Skeleton className="h-5 w-48" />}
        reviewerName={null}
      >
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </ReviewShell>
    ),
    Errored: (error) => (
      <ReviewShell title={null} reviewerName={null}>
        <Empty className="lg:col-span-2">
          <EmptyHeader>
            <EmptyTitle>Failed to load the video</EmptyTitle>
            <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </ReviewShell>
    ),
    Empty: <ReviewLinkNotFound />,
    Success: ({ data }) => (
      <ReviewShell
        title={<h1 className="font-medium">{data.video.title}</h1>}
        reviewerName={data.reviewer?.name ?? null}
      >
        <ReviewWorkspace
          secret={secret}
          data={data}
          initialFeedbackId={initialFeedbackId}
          onPlaybackError={handlePlaybackError}
        />
      </ReviewShell>
    ),
  });
}

type ReviewShellProps = {
  title: ReactNode;
  reviewerName: string | null;
  children: ReactNode;
};

// The "Theater" layout: the player is the stage, the list column beside it on
// desktop and under it on a phone.
function ReviewShell({ title, reviewerName, children }: ReviewShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <AppLogo className="text-base" />
            <span className="text-muted-foreground">/</span>
            <div className="min-w-0 truncate">{title}</div>
          </div>
          <ReviewerChip name={reviewerName} />
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {children}
      </main>
    </div>
  );
}
