"use client";

import { AppLogo } from "@/app/_components/app-logo";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { useRef, type CSSProperties } from "react";
import { ClosedBanner } from "../_components/closed-banner";
import { ReviewerChip } from "../_components/reviewer-chip";
import { captureFrame } from "../_helpers/capture-frame";
import { describeMarker } from "../_helpers/describe-marker";
import { formatTimecode } from "../_helpers/format-timecode";
import { FeedbackCard, formatSelectionTime } from "./feedback-card.client";
import { FrameOverlay } from "./frame-overlay.client";
import { Timeline } from "./timeline.client";
import { useVideoPlayer, type VideoPlayer } from "./use-video-player";
import {
  VIDEO_SRC,
  VIDEO_TITLE,
  type Draft,
  type FrameArea,
  type FramePoint,
  type VideoReviewModel,
} from "./use-video-review";

export const VARIANT_A_NAME = "Theater, popover at the point";

type VariantATheaterProps = {
  review: VideoReviewModel;
  readOnly: boolean;
};

// Variant A: the video is the stage. A click on the paused frame opens the
// composer right where the Reviewer pointed; the comments sit beside it.
export function VariantATheater({ review, readOnly }: VariantATheaterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer(videoRef);
  const { draft } = review;

  function placePoint(point: FramePoint) {
    player.pause();
    review.anchorDraft(player.currentMs);
    review.updateDraftSelection({ point, area: null });
  }

  function placeArea(area: FrameArea) {
    player.pause();
    review.anchorDraft(player.currentMs);
    review.updateDraftSelection({ area, point: null });
  }

  function openFeedback(id: string) {
    const feedback = review.feedbacks.find((item) => item.id === id);
    if (!feedback) return;
    player.pause();
    player.seek(feedback.selection.startMs);
    review.setActiveFeedbackId(id);
  }

  function submit() {
    const video = videoRef.current;
    review.submitDraft(video ? captureFrame(video) : null);
  }

  const markers = review.visibleFeedbacks.map((feedback) => ({
    id: feedback.id,
    startMs: feedback.selection.startMs,
    endMs: feedback.selection.endMs,
    status: feedback.status,
    isOwn: feedback.reviewerName === review.reviewerName,
  }));

  const composer = draft ? (
    <TheaterComposer
      draft={draft}
      player={player}
      review={review}
      onSubmit={submit}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <AppLogo className="text-base" />
            <span className="text-muted-foreground">/</span>
            <h1 className="font-medium">{VIDEO_TITLE}</h1>
          </div>
          <ReviewerChip name={review.reviewerName} />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          {readOnly ? <ClosedBanner /> : null}

          <div
            className="relative overflow-hidden rounded-lg bg-black"
            style={{
              aspectRatio: `${player.frameSize.width} / ${player.frameSize.height}`,
            }}
          >
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              crossOrigin="anonymous"
              playsInline
              preload="metadata"
              className="size-full"
            />
            <FrameOverlay
              draft={draft?.selection ?? null}
              disabled={readOnly}
              onPoint={placePoint}
              onArea={placeArea}
            />
            {draft ? (
              <div
                className="absolute z-10 hidden w-80 sm:block"
                style={popoverStyle(draft)}
              >
                {composer}
              </div>
            ) : null}
          </div>

          <Timeline
            durationMs={player.durationMs}
            currentMs={player.currentMs}
            markers={markers}
            draft={draft?.selection ?? null}
            activeId={review.activeFeedbackId}
            onSeek={player.seek}
            onMarkerClick={openFeedback}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={player.togglePlay}
              aria-label={player.paused ? "Play" : "Pause"}
            >
              {player.paused ? <PlayIcon /> : <PauseIcon />}
            </Button>
            <span className="font-mono text-sm tabular-nums">
              {formatTimecode(player.currentMs)}
              <span className="text-muted-foreground">
                {" "}
                / {formatTimecode(player.durationMs)}
              </span>
            </span>
            {readOnly ? null : (
              <div className="ml-auto flex flex-wrap gap-2">
                <RangeButtons player={player} review={review} />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    player.pause();
                    review.anchorDraft(player.currentMs);
                  }}
                  disabled={draft !== null}
                >
                  Comment at {formatTimecode(player.currentMs)}
                </Button>
              </div>
            )}
          </div>

          {draft ? <div className="sm:hidden">{composer}</div> : null}

          {readOnly ? null : (
            <p className="text-sm text-muted-foreground">
              Click the frame to point at something, or drag to outline an area.
              Mark in and out to comment on a stretch.
            </p>
          )}
        </section>

        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">
              Comments{" "}
              <span className="text-muted-foreground">
                ({review.visibleFeedbacks.length})
              </span>
            </h2>
            <Label className="gap-2 text-xs font-normal text-muted-foreground">
              <Switch
                checked={review.showResolved}
                onCheckedChange={review.setShowResolved}
              />
              Show resolved ({review.resolvedCount})
            </Label>
          </div>
          <div className="space-y-2">
            {review.visibleFeedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                active={feedback.id === review.activeFeedbackId}
                canEdit={!readOnly && review.canEdit(feedback)}
                isOwn={feedback.reviewerName === review.reviewerName}
                onSelect={() => openFeedback(feedback.id)}
                onEdit={(message) => review.editFeedback(feedback.id, message)}
                onDelete={() => review.deleteFeedback(feedback.id)}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Anchors the popover at the point or the area's top-right corner, flipping
// it when it would run off the frame. No marker: bottom center of the frame.
function popoverStyle(draft: Draft): CSSProperties {
  const { point, area } = draft.selection;
  const anchor = area
    ? { x: area.x + area.width, y: area.y }
    : (point ?? { x: 0.5, y: 0.95 });
  const flipX = anchor.x > 0.6;
  const flipY = anchor.y > 0.55;
  return {
    left: `${anchor.x * 100}%`,
    top: `${anchor.y * 100}%`,
    transform: `translate(${flipX ? "calc(-100% - 12px)" : "12px"}, ${flipY ? "calc(-100% - 12px)" : "12px"})`,
  };
}

type RangeButtonsProps = {
  player: VideoPlayer;
  review: VideoReviewModel;
};

function RangeButtons({ player, review }: RangeButtonsProps) {
  const { draft } = review;
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          player.pause();
          review.anchorDraft(player.currentMs);
        }}
      >
        Mark in
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!draft || player.currentMs <= draft.selection.startMs}
        onClick={() => {
          player.pause();
          review.updateDraftSelection({ endMs: player.currentMs });
        }}
      >
        Mark out
      </Button>
    </>
  );
}

type TheaterComposerProps = {
  draft: Draft;
  player: VideoPlayer;
  review: VideoReviewModel;
  onSubmit: () => void;
};

function TheaterComposer({
  draft,
  player,
  review,
  onSubmit,
}: TheaterComposerProps) {
  const markerLabel =
    describeMarker(draft.selection) ?? "No marker, whole frame";

  return (
    <form
      className="space-y-2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") review.discardDraft();
      }}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-medium tabular-nums">
          {formatSelectionTime(draft.selection)}
        </span>
        <span className="text-muted-foreground">{markerLabel}</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="ml-auto size-6"
          onClick={review.discardDraft}
          aria-label="Discard"
        >
          <XIcon />
        </Button>
      </div>
      <Textarea
        value={draft.message}
        onChange={(event) => review.setDraftMessage(event.target.value)}
        placeholder="What should change here?"
        rows={3}
        autoFocus
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 sm:hidden">
          <RangeButtons player={player} review={review} />
        </div>
        <div className="ml-auto flex gap-1">
          {draft.selection.endMs !== null ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => review.updateDraftSelection({ endMs: null })}
            >
              Clear out point
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={!draft.message.trim()}>
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
