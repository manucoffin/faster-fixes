"use client";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { MessageSquareIcon, PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { ClosedBanner } from "../_components/closed-banner";
import { ReviewerChip } from "../_components/reviewer-chip";
import { captureFrame } from "../_helpers/capture-frame";
import { describeMarker } from "../_helpers/describe-marker";
import { formatTimecode } from "../_helpers/format-timecode";
import { FeedbackCard, formatSelectionTime } from "./feedback-card.client";
import { FrameOverlay, type FramePin } from "./frame-overlay.client";
import { Timeline } from "./timeline.client";
import { useVideoPlayer } from "./use-video-player";
import {
  VIDEO_SRC,
  VIDEO_TITLE,
  type FrameArea,
  type FramePoint,
  type VideoReviewModel,
} from "./use-video-review";

export const VARIANT_C_NAME = "Pins on the frame, drag the bar for a range";

type VariantCPinsProps = {
  review: VideoReviewModel;
  readOnly: boolean;
};

// How long an instant comment stays pinned on the frame while playing.
const PIN_WINDOW_MS = 1500;

// Variant C: no list on screen. Comments are numbered pins that appear on
// the frame when the playhead reaches them; the timeline is the only
// navigation, and dragging along it marks a range.
export function VariantCPins({ review, readOnly }: VariantCPinsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer(videoRef);
  const { draft } = review;

  function placePoint(point: FramePoint) {
    review.anchorDraft(player.currentMs);
    review.updateDraftSelection({ point, area: null });
  }

  function placeArea(area: FrameArea) {
    player.pause();
    review.anchorDraft(player.currentMs);
    review.updateDraftSelection({ area, point: null });
  }

  // A tap on a playing video pauses it; the next tap places the pin.
  function handleTap() {
    if (player.paused) return false;
    player.pause();
    return true;
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

  const pins: FramePin[] = review.visibleFeedbacks.flatMap(
    (feedback, index) => {
      const { startMs, endMs } = feedback.selection;
      const windowEnd = endMs ?? startMs + PIN_WINDOW_MS;
      const visible =
        player.currentMs >= startMs - 100 && player.currentMs <= windowEnd;
      const hasMarker =
        feedback.selection.point !== null || feedback.selection.area !== null;
      return visible && hasMarker
        ? [
            {
              id: feedback.id,
              label: String(index + 1),
              selection: feedback.selection,
              active: feedback.id === review.activeFeedbackId,
            },
          ]
        : [];
    },
  );

  const activeFeedback = review.feedbacks.find(
    (feedback) => feedback.id === review.activeFeedbackId,
  );

  return (
    <div className="dark fixed inset-0 flex flex-col bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pt-3 pb-8">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Acme Studio</div>
          <h1 className="truncate font-medium">{VIDEO_TITLE}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden sm:inline-flex">
            <ReviewerChip name={review.reviewerName} />
          </span>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="secondary">
                <MessageSquareIcon /> {review.visibleFeedbacks.length}
              </Button>
            </SheetTrigger>
            <SheetContent className="dark flex w-full flex-col gap-0 bg-background p-0 text-foreground sm:max-w-md">
              <SheetHeader className="border-b">
                <SheetTitle>Comments</SheetTitle>
                <Label className="gap-2 text-xs font-normal text-muted-foreground">
                  <Switch
                    checked={review.showResolved}
                    onCheckedChange={review.setShowResolved}
                  />
                  Show resolved ({review.resolvedCount})
                </Label>
              </SheetHeader>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {review.visibleFeedbacks.map((feedback, index) => (
                  <div key={feedback.id} className="flex gap-2">
                    <span className="mt-3 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                    <FeedbackCard
                      feedback={feedback}
                      active={feedback.id === review.activeFeedbackId}
                      canEdit={!readOnly && review.canEdit(feedback)}
                      isOwn={feedback.reviewerName === review.reviewerName}
                      onSelect={() => openFeedback(feedback.id)}
                      onEdit={(message) =>
                        review.editFeedback(feedback.id, message)
                      }
                      onDelete={() => review.deleteFeedback(feedback.id)}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          className="relative max-h-full"
          style={{
            aspectRatio: `${player.frameSize.width} / ${player.frameSize.height}`,
            // The frame fills whichever of the two viewport axes binds first.
            width: `min(100%, calc(100dvh * ${player.frameSize.width / player.frameSize.height}))`,
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
            pins={pins}
            onPinClick={openFeedback}
            onTap={handleTap}
            onPoint={placePoint}
            onArea={placeArea}
          >
            {player.paused && !draft && !readOnly && !activeFeedback ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  Tap to pin a comment, drag to outline an area
                </span>
              </div>
            ) : null}
          </FrameOverlay>

          {activeFeedback && !draft ? (
            <div className="absolute inset-x-2 bottom-2 z-10 sm:left-auto sm:w-80">
              <div className="relative">
                <FeedbackCard
                  feedback={activeFeedback}
                  active={false}
                  canEdit={!readOnly && review.canEdit(activeFeedback)}
                  isOwn={activeFeedback.reviewerName === review.reviewerName}
                  onSelect={() => undefined}
                  onEdit={(message) =>
                    review.editFeedback(activeFeedback.id, message)
                  }
                  onDelete={() => review.deleteFeedback(activeFeedback.id)}
                  hideThumbnail
                  className="shadow-xl"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 size-6"
                  onClick={() => review.setActiveFeedbackId(null)}
                  aria-label="Close"
                >
                  <XIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-4 pt-8 pb-16">
        {readOnly ? <ClosedBanner /> : null}
        {draft ? (
          <form
            className="mx-auto max-w-xl space-y-2 rounded-lg border bg-card p-3 text-card-foreground shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-medium tabular-nums">
                {formatSelectionTime(draft.selection)}
              </span>
              <span className="text-muted-foreground">
                {describeMarker(draft.selection, "Pin placed") ??
                  "Stretch of the video"}
              </span>
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
              rows={2}
              autoFocus
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!draft.message.trim()}>
                Post
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-1">
            <Timeline
              thick
              durationMs={player.durationMs}
              currentMs={player.currentMs}
              markers={markers}
              draft={null}
              activeId={review.activeFeedbackId}
              onSeek={player.seek}
              onMarkerClick={openFeedback}
              onRangeDrag={
                readOnly
                  ? undefined
                  : (startMs, endMs) => {
                      player.pause();
                      player.seek(startMs);
                      review.anchorDraft(startMs);
                      review.updateDraftSelection({ endMs });
                    }
              }
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="secondary"
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
                <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                  Tap the bar to seek, drag along it to comment on a stretch
                </span>
              )}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
