"use client";

import { Badge } from "@workspace/ui/components/badge";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { cn } from "@workspace/ui/lib/utils";
import { SelectionMarker } from "../../_components/selection-marker";
import { getFeedbackStatusLabel } from "../../_helpers/feedback-status-label";
import { formatFeedbackTime } from "../../_helpers/format-timecode";
import { isHiddenByDefault } from "../../_helpers/list-visible-feedback";
import { mapSelectionToBox } from "../../_helpers/map-selection-to-box";
import type {
  ReviewFeedbackItem,
  ReviewVideo,
} from "../../_types/review-page-data";

// The thumbnail box is 16:9 whatever the Video's shape; the frame is
// letterboxed inside it and the Selection follows.
const THUMBNAIL_BOX = { width: 16, height: 9 };

type FeedbackCardProps = {
  feedback: ReviewFeedbackItem;
  video: ReviewVideo;
  isOwn: boolean;
  isActive: boolean;
  link: string;
  onSelect: () => void;
};

export function FeedbackCard({
  feedback,
  video,
  isOwn,
  isActive,
  link,
  onSelect,
}: FeedbackCardProps) {
  const geometry = mapSelectionToBox(
    feedback,
    { width: video.width ?? 16, height: video.height ?? 9 },
    THUMBNAIL_BOX,
  );

  return (
    <article
      id={`feedback-${feedback.id}`}
      className={cn(
        "rounded-lg border bg-card p-3 text-card-foreground transition-colors",
        isActive ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={onSelect}
        aria-pressed={isActive}
      >
        <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded bg-black">
          {feedback.screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Screenshots come from the deployment's own storage host, which is not in the static remotePatterns allowlist
            <img
              src={feedback.screenshotUrl}
              alt=""
              className="size-full object-contain"
            />
          ) : null}
          {geometry ? <SelectionMarker geometry={geometry} /> : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-mono font-medium tabular-nums">
              {formatFeedbackTime(feedback.startMs, feedback.endMs)}
            </span>
            <span
              className={cn(
                "truncate",
                isOwn ? "font-medium" : "text-muted-foreground",
              )}
            >
              {isOwn ? "You" : feedback.reviewer.name}
            </span>
            <Badge
              variant={
                isHiddenByDefault(feedback.status) ? "outline" : "secondary"
              }
              className="ml-auto"
            >
              {getFeedbackStatusLabel(feedback.status)}
            </Badge>
          </div>
          <p className="text-sm leading-snug break-words whitespace-pre-wrap">
            {feedback.comment}
          </p>
        </div>
      </button>

      <div className="mt-1 flex justify-end">
        <CopyButton
          content={link}
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
        >
          Copy link
        </CopyButton>
      </div>
    </article>
  );
}
