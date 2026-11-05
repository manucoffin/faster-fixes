"use client";

import { FeedbackDetailPanel } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/feedback-detail-panel.client";
import { getFeedbackStatusAppearance } from "@/app/_domains/feedback/_components/feedback-status-appearance";
import { useVideoPlayer } from "@/app/_domains/video/video-player/use-video-player";
import { VideoPlayer } from "@/app/_domains/video/video-player/video-player.client";
import {
  VideoTimeline,
  type VideoTimelineMarker,
} from "@/app/_domains/video/video-player/video-timeline.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Download, MessageSquare, Upload } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";

import type { GetVideoOutput } from "../_services/get-video";
import { useExportVideoFeedback } from "./use-export-video-feedback";
import { VideoFeedbackCard } from "./video-feedback-card.client";

type VideoReviewProps = {
  video: GetVideoOutput;
  onPlaybackError: () => void;
};

type PlayableVideo = GetVideoOutput & { playbackUrl: string };

export function VideoReview({ video, onPlaybackError }: VideoReviewProps) {
  if (video.playbackUrl === null) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Upload />
          </EmptyMedia>
          <EmptyTitle>Upload in progress</EmptyTitle>
          <EmptyDescription>
            This video can be reviewed once its upload completes.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <VideoReviewWorkspace
      video={{ ...video, playbackUrl: video.playbackUrl }}
      onPlaybackError={onPlaybackError}
    />
  );
}

type VideoReviewWorkspaceProps = {
  video: PlayableVideo;
  onPlaybackError: () => void;
};

type FeedbackItem = GetVideoOutput["feedback"][number];

function toTimelineMarker(feedback: FeedbackItem): VideoTimelineMarker {
  return {
    id: feedback.id,
    startMs: feedback.startMs ?? 0,
    endMs: feedback.endMs,
    colorClassName: getFeedbackStatusAppearance(feedback.status)
      .swatchClassName,
  };
}

function scrollCardIntoView(feedbackId: string) {
  document
    .getElementById(`feedback-${feedbackId}`)
    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// The player and the list stay in step: a card or a marker seeks the Video
// and opens the same detail Sheet the Task board does, through `feedbackId`.
function VideoReviewWorkspace({
  video,
  onPlaybackError,
}: VideoReviewWorkspaceProps) {
  const trpc = useTRPC();
  const [selectedFeedbackId, setSelectedFeedbackId] =
    useQueryState("feedbackId");
  // A `feedbackId` link opens on that Feedback's in point.
  const [initialFeedback] = useState(() =>
    video.feedback.find((item) => item.id === selectedFeedbackId),
  );

  const exportFeedbackMutation = useExportVideoFeedback({
    videoId: video.id,
    title: video.title,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer(
    videoRef,
    video.playbackUrl,
    video.durationMs,
    initialFeedback?.startMs ?? 0,
  );

  useEffect(() => {
    if (initialFeedback) scrollCardIntoView(initialFeedback.id);
  }, [initialFeedback]);

  const gitHubLinkQuery = useQuery(
    trpc.authenticated.projects.github.getLink.queryOptions({
      projectId: video.projectId,
    }),
  );
  const linearLinkQuery = useQuery(
    trpc.authenticated.projects.linear.getLink.queryOptions({
      projectId: video.projectId,
    }),
  );
  const jiraLinkQuery = useQuery(
    trpc.authenticated.projects.jira.getLink.queryOptions({
      projectId: video.projectId,
    }),
  );

  const selectedFeedback =
    video.feedback.find((item) => item.id === selectedFeedbackId) ?? null;

  function openFeedback(feedbackId: string) {
    const feedback = video.feedback.find((item) => item.id === feedbackId);
    if (!feedback) return;
    player.pause();
    player.seek(feedback.startMs ?? 0);
    void setSelectedFeedbackId(feedback.id);
    scrollCardIntoView(feedback.id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section>
        <VideoPlayer
          video={video}
          videoRef={videoRef}
          player={player}
          onPlaybackError={onPlaybackError}
          timeline={
            <VideoTimeline
              durationMs={player.durationMs}
              currentMs={player.currentMs}
              markers={video.feedback.map(toTimelineMarker)}
              activeMarkerId={selectedFeedbackId}
              onSeek={player.seek}
              onMarkerClick={openFeedback}
            />
          }
        />
      </section>

      <aside className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium">
            Feedback{" "}
            <span className="text-muted-foreground">
              ({video.feedback.length})
            </span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            disabled={exportFeedbackMutation.isPending}
            onClick={() => exportFeedbackMutation.mutate()}
          >
            <Download />
            Export
          </Button>
        </div>
        {video.feedback.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>No feedback yet</EmptyTitle>
              <EmptyDescription>
                Feedback left on the review page will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="flex flex-col gap-2">
            {video.feedback.map((feedback) => (
              <li key={feedback.id}>
                <VideoFeedbackCard
                  feedback={feedback}
                  frame={{
                    width: video.width ?? 16,
                    height: video.height ?? 9,
                  }}
                  isActive={feedback.id === selectedFeedbackId}
                  onSelect={() => openFeedback(feedback.id)}
                />
              </li>
            ))}
          </ol>
        )}
      </aside>

      <FeedbackDetailPanel
        feedback={selectedFeedback}
        open={selectedFeedback !== null}
        onOpenChange={(open) => {
          if (!open) void setSelectedFeedbackId(null);
        }}
        projectId={video.projectId}
        hasGitHubLink={!!gitHubLinkQuery.data}
        hasLinearLink={!!linearLinkQuery.data}
        hasJiraLink={!!jiraLinkQuery.data}
      />
    </div>
  );
}
