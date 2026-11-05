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
import { useDocumentTopVariable } from "@/app/_hooks/use-document-top-variable";
import type {
  ReviewFeedbackItem,
  ReviewVideo,
} from "../../_types/review-page-data";
import { FeedbackCard } from "./feedback-card.client";

type FeedbackListProps = {
  secret: string;
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
  secret,
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
  const columnRef = useDocumentTopVariable<HTMLElement>();

  return (
    // On desktop the column ends at the viewport bottom, less the page's
    // bottom padding, and only the cards scroll, so the page itself does not.
    <aside
      ref={columnRef}
      className="flex flex-col gap-3 lg:max-h-[calc(100svh-var(--document-top,0px)-1.5rem)] lg:self-start"
    >
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
        // The 1px padding keeps the active card's ring clear of the clip edge.
        <div className="space-y-2 lg:-m-px lg:min-h-0 lg:overflow-y-auto lg:p-px">
          {feedback.map((item) => (
            <FeedbackCard
              key={item.id}
              secret={secret}
              feedback={item}
              video={video}
              isOwn={item.reviewer.id === ownReviewerId}
              isActive={item.id === activeFeedbackId}
              canManage={
                video.annotationsOpen &&
                item.status === "new" &&
                item.reviewer.id === ownReviewerId
              }
              link={getFeedbackLink(item.id)}
              onSelect={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
