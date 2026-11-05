"use client";

import { getBoardStatusAppearance } from "@/app/(authenticated)/(project)/inbox/_features/kanban/board-status-appearance";
import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import { getFeedbackStatusLabel } from "@/app/_domains/feedback/_helpers/feedback-status-label";
import { SelectionMarker } from "@/app/_domains/video/_components/selection-marker";
import { formatFeedbackTime } from "@/app/_domains/video/_helpers/format-timecode";
import { mapSelectionToBox } from "@/app/_domains/video/_helpers/map-selection-to-box";
import { readVideoSelection } from "@/app/_domains/video/_helpers/read-video-selection";
import { cn } from "@workspace/ui/lib/utils";

import type { GetVideoOutput } from "../_services/get-video";

// The thumbnail box is 16:9 whatever the Video's shape; the frame is
// letterboxed inside it and the Selection follows.
const THUMBNAIL_BOX = { width: 16, height: 9 };

type VideoFeedbackCardProps = {
  feedback: GetVideoOutput["feedback"][number];
  frame: { width: number; height: number };
  isActive: boolean;
  onSelect: () => void;
};

export function VideoFeedbackCard({
  feedback,
  frame,
  isActive,
  onSelect,
}: VideoFeedbackCardProps) {
  const geometry = mapSelectionToBox(
    readVideoSelection(feedback),
    frame,
    THUMBNAIL_BOX,
  );
  const appearance = getBoardStatusAppearance(feedback.status);
  const StatusIcon = appearance.icon;
  const status = FeedbackStatusEnum.safeParse(feedback.status);

  return (
    <button
      id={`feedback-${feedback.id}`}
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left text-card-foreground transition-colors",
        isActive ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50",
      )}
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
            {formatFeedbackTime(feedback.startMs ?? 0, feedback.endMs)}
          </span>
          <span className="truncate text-muted-foreground">
            {feedback.reviewer.name}
          </span>
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
              appearance.pillClassName,
            )}
          >
            <StatusIcon className="size-3" />
            {status.success
              ? getFeedbackStatusLabel(status.data)
              : feedback.status}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-snug break-words whitespace-pre-wrap">
          {feedback.comment}
        </p>
      </div>
    </button>
  );
}
