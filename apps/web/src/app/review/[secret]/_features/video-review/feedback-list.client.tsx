"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import type { ReactNode } from "react";
import type {
  ReviewFeedbackItem,
  ReviewVideo,
} from "../../_types/review-page-data";
import { FeedbackCard } from "./feedback-card.client";

type FeedbackListProps = {
  video: ReviewVideo;
  feedback: ReviewFeedbackItem[];
  hiddenCount: number;
  showResolved: boolean;
  onShowResolvedChange: (showResolved: boolean) => void;
  ownReviewerId: string | null;
  activeFeedbackId: string | null;
  getFeedbackLink: (feedbackId: string) => string;
  onSelect: (feedback: ReviewFeedbackItem) => void;
  composer: ReactNode;
};

export function FeedbackList({
  video,
  feedback,
  hiddenCount,
  showResolved,
  onShowResolvedChange,
  ownReviewerId,
  activeFeedbackId,
  getFeedbackLink,
  onSelect,
  composer,
}: FeedbackListProps) {
  return (
    <aside className="space-y-3">
      {/* At the head of the list column: beside the player on desktop, right
          under it on a phone. */}
      {composer}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">
          Comments{" "}
          <span className="text-muted-foreground">({feedback.length})</span>
        </h2>
        <Label className="gap-2 text-xs font-normal text-muted-foreground">
          <Switch
            checked={showResolved}
            onCheckedChange={onShowResolvedChange}
          />
          Show resolved ({hiddenCount})
        </Label>
      </div>

      {feedback.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No comments</EmptyTitle>
            <EmptyDescription>
              {hiddenCount > 0
                ? "Every comment on this video is resolved or archived."
                : "No one has commented on this video yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {feedback.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              video={video}
              isOwn={item.reviewer.id === ownReviewerId}
              isActive={item.id === activeFeedbackId}
              link={getFeedbackLink(item.id)}
              onSelect={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
