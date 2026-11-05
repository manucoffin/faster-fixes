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
import { AnnotationsClosedBanner } from "../../_components/annotations-closed-banner";
import { ReviewLinkNotFound } from "../../_components/review-link-not-found";
import { ReviewerChip } from "../../_components/reviewer-chip";
import { ReviewPlayer } from "./review-player.client";
import { useReviewPageQuery } from "./use-review-page-query";

// A failing player refetches the signed URL, but not more often than this, so
// a file that cannot play does not loop on the API.
const PLAYBACK_RETRY_INTERVAL_MS = 30 * 1000;

type VideoReviewProps = {
  secret: string;
};

export function VideoReview({ secret }: VideoReviewProps) {
  const reviewPageQuery = useReviewPageQuery(secret);

  function handlePlaybackError() {
    const sinceLastRead = Date.now() - reviewPageQuery.dataUpdatedAt;
    if (sinceLastRead >= PLAYBACK_RETRY_INTERVAL_MS) {
      void reviewPageQuery.refetch();
    }
  }

  return matchQueryStatus(reviewPageQuery, {
    Loading: (
      <ReviewShell title={<Skeleton className="h-5 w-48" />}>
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </ReviewShell>
    ),
    Errored: (error) => (
      <ReviewShell title={null}>
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
      <ReviewShell title={<h1 className="font-medium">{data.video.title}</h1>}>
        <section className="space-y-3">
          {data.video.annotationsOpen ? null : <AnnotationsClosedBanner />}
          <ReviewPlayer
            video={data.video}
            onPlaybackError={handlePlaybackError}
          />
        </section>
        {/* Reserved for the Feedback list. */}
        <aside />
      </ReviewShell>
    ),
  });
}

type ReviewShellProps = {
  title: ReactNode;
  children: ReactNode;
};

// The "Theater" layout: the player is the stage, the list column beside it on
// desktop and under it on a phone.
function ReviewShell({ title, children }: ReviewShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <AppLogo className="text-base" />
            <span className="text-muted-foreground">/</span>
            <div className="min-w-0 truncate">{title}</div>
          </div>
          <ReviewerChip />
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {children}
      </main>
    </div>
  );
}
