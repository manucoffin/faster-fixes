"use client";

import { AppLogo } from "@/app/_components/app-logo";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  ClockIcon,
  MousePointerClickIcon,
  PauseIcon,
  PlayIcon,
  SquareDashedIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { ClosedBanner } from "../_components/closed-banner";
import { ReviewerChip } from "../_components/reviewer-chip";
import { captureFrame } from "../_helpers/capture-frame";
import { describeMarker } from "../_helpers/describe-marker";
import { formatTimecode } from "../_helpers/format-timecode";
import { FeedbackCard } from "./feedback-card.client";
import { FrameOverlay } from "./frame-overlay.client";
import { Timeline } from "./timeline.client";
import { useVideoPlayer } from "./use-video-player";
import {
  VIDEO_SRC,
  VIDEO_TITLE,
  type FrameArea,
  type FramePoint,
  type VideoReviewModel,
} from "./use-video-review";

export const VARIANT_B_NAME = "Inbox, persistent composer";

type VariantBInboxProps = {
  review: VideoReviewModel;
  readOnly: boolean;
};

type ArmedTool = "point" | "area" | null;

// Variant B: the comments are a thread on the left, the composer is always
// open under the player. Typing anchors the comment at the playhead; a point
// or an area is an optional extra placed on the frame.
export function VariantBInbox({ review, readOnly }: VariantBInboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer(videoRef);
  const [armedTool, setArmedTool] = useState<ArmedTool>(null);
  const { draft } = review;

  // The composer is live before any draft exists; the first interaction
  // creates one at the playhead without moving an existing one.
  function ensureDraft() {
    if (!draft) review.anchorDraft(player.currentMs);
  }

  function placePoint(point: FramePoint) {
    player.pause();
    ensureDraft();
    review.updateDraftSelection({ point, area: null });
    setArmedTool(null);
  }

  function placeArea(area: FrameArea) {
    player.pause();
    ensureDraft();
    review.updateDraftSelection({ area, point: null });
    setArmedTool(null);
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
    setArmedTool(null);
  }

  const markers = review.visibleFeedbacks.map((feedback) => ({
    id: feedback.id,
    startMs: feedback.selection.startMs,
    endMs: feedback.selection.endMs,
    status: feedback.status,
    isOwn: feedback.reviewerName === review.reviewerName,
  }));

  const anchorMs = draft ? draft.selection.startMs : player.currentMs;
  const marker = draft ? describeMarker(draft.selection) : null;

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:h-screen lg:grid-cols-[380px_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_minmax(0,1fr)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 lg:col-start-2 lg:row-start-1">
        <div className="flex items-center gap-3">
          <AppLogo className="text-base" />
          <span className="text-muted-foreground">/</span>
          <h1 className="font-medium">{VIDEO_TITLE}</h1>
        </div>
        <ReviewerChip name={review.reviewerName} />
      </header>

      <div className="sticky top-0 z-10 bg-black lg:static lg:col-start-2 lg:row-start-2 lg:bg-background lg:px-6 lg:pt-4">
        <div
          className="relative mx-auto max-h-[55vh] bg-black lg:overflow-hidden lg:rounded-lg"
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
          >
            {armedTool ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                  {armedTool === "point"
                    ? "Click the frame to place the point"
                    : "Drag on the frame to outline the area"}
                </span>
              </div>
            ) : null}
          </FrameOverlay>
        </div>
      </div>

      <div className="space-y-2 px-4 pt-2 lg:col-start-2 lg:row-start-3 lg:px-6">
        <Timeline
          durationMs={player.durationMs}
          currentMs={player.currentMs}
          markers={markers}
          draft={draft?.selection ?? null}
          activeId={review.activeFeedbackId}
          onSeek={player.seek}
          onMarkerClick={openFeedback}
        />
        <div className="flex items-center gap-2">
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
        </div>
        {readOnly ? <ClosedBanner /> : null}
      </div>

      <aside className="border-t lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:overflow-y-auto lg:border-t-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3">
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
        <div className="space-y-2 px-4 pb-28 lg:pb-4">
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

      {readOnly ? null : (
        <form
          className="sticky bottom-0 z-10 space-y-2 border-t bg-background p-3 pb-16 lg:static lg:col-start-2 lg:row-start-4 lg:self-start lg:border-t-0 lg:px-6 lg:pb-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={draft ? "secondary" : "outline"}
              onClick={() => {
                player.pause();
                review.anchorDraft(player.currentMs);
              }}
              title="Move the in point to the playhead"
            >
              <ClockIcon /> {formatTimecode(anchorMs)}
            </Button>
            {draft?.selection.endMs !== null && draft ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => review.updateDraftSelection({ endMs: null })}
              >
                to {formatTimecode(draft.selection.endMs)} <XIcon />
              </Button>
            ) : (
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
                Set out point
              </Button>
            )}
            <span className="mx-1 h-5 w-px bg-border" />
            {marker ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  review.updateDraftSelection({ point: null, area: null })
                }
              >
                {marker} <XIcon />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={armedTool === "point" ? "secondary" : "outline"}
                  onClick={() => {
                    player.pause();
                    ensureDraft();
                    setArmedTool("point");
                  }}
                >
                  <MousePointerClickIcon /> Point
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={armedTool === "area" ? "secondary" : "outline"}
                  onClick={() => {
                    player.pause();
                    ensureDraft();
                    setArmedTool("area");
                  }}
                >
                  <SquareDashedIcon /> Area
                </Button>
              </>
            )}
          </div>
          <Textarea
            value={draft?.message ?? ""}
            placeholder={`Comment at ${formatTimecode(player.currentMs)}`}
            rows={2}
            onFocus={() => {
              player.pause();
              ensureDraft();
            }}
            onChange={(event) => {
              ensureDraft();
              review.setDraftMessage(event.target.value);
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Playback pauses while you type.
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!draft}
                onClick={() => {
                  review.discardDraft();
                  setArmedTool(null);
                }}
              >
                Discard
              </Button>
              <Button type="submit" size="sm" disabled={!draft?.message.trim()}>
                Post comment
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
