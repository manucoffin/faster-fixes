"use client";

import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { SelectionMarker } from "@/app/_domains/video/_components/selection-marker";
import { FeedbackStatusPill } from "@/app/_domains/feedback/_components/feedback-status-pill";
import { formatFeedbackTime } from "@/app/_domains/video/_helpers/format-timecode";
import { mapSelectionToBox } from "@/app/_domains/video/_helpers/map-selection-to-box";
import type {
  ReviewFeedbackItem,
  ReviewVideo,
} from "../../_types/review-page-data";
import { DeleteFeedbackButton } from "./delete-feedback-button.client";
import { EditFeedbackForm } from "./edit-feedback-form.client";
import { useOwnFeedbackMutations } from "./use-own-feedback-mutations";

// The thumbnail box is 16:9 whatever the Video's shape; the frame is
// letterboxed inside it and the Selection follows.
const THUMBNAIL_BOX = { width: 16, height: 9 };

type FeedbackCardProps = {
  secret: string;
  feedback: ReviewFeedbackItem;
  video: ReviewVideo;
  isOwn: boolean;
  isActive: boolean;
  canManage: boolean;
  link: string;
  onSelect: () => void;
};

export function FeedbackCard({
  secret,
  feedback,
  video,
  isOwn,
  isActive,
  canManage,
  link,
  onSelect,
}: FeedbackCardProps) {
  const [isEditingRequested, setIsEditing] = useState(false);
  // A refresh that finds the Feedback no longer editable closes the form.
  const isEditing = canManage && isEditingRequested;
  const { editFeedback, deleteFeedback } = useOwnFeedbackMutations({
    secret,
    videoId: video.id,
    feedbackId: feedback.id,
  });

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
            <FeedbackStatusPill status={feedback.status} className="ml-auto" />
          </div>
          {isEditing ? null : (
            <p className="text-sm leading-snug break-words whitespace-pre-wrap">
              {feedback.comment}
            </p>
          )}
        </div>
      </button>

      {/* Outside the select button: a textarea cannot sit inside a button. */}
      {isEditing ? (
        <div className="mt-2">
          <EditFeedbackForm
            comment={feedback.comment}
            isSaving={editFeedback.isPending}
            onSave={(input) =>
              editFeedback.mutate(input, {
                onSuccess: () => setIsEditing(false),
              })
            }
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : null}

      <div className="mt-1 flex justify-end gap-1">
        {canManage && !isEditing ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <DeleteFeedbackButton
              isDeleting={deleteFeedback.isPending}
              onConfirm={() => deleteFeedback.mutate()}
            />
          </>
        ) : null}
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
