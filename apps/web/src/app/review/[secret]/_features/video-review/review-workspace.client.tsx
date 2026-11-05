"use client";

import { useEffect, useRef, useState } from "react";
import { AnnotationsClosedBanner } from "../../_components/annotations-closed-banner";
import {
  anchorCommentDraft,
  clearCommentDraftOut,
  markCommentDraftOut,
  type CommentDraft,
} from "../../_helpers/comment-draft";
import {
  isHiddenByDefault,
  listVisibleFeedback,
} from "../../_helpers/list-visible-feedback";
import type {
  ReviewFeedbackItem,
  ReviewPageData,
} from "../../_types/review-page-data";
import { CommentControls } from "./comment-controls.client";
import { FeedbackComposer } from "./feedback-composer.client";
import { FeedbackList } from "./feedback-list.client";
import { NamePromptDialog } from "./name-prompt-dialog.client";
import { ReviewPlayer } from "./review-player.client";
import { ReviewTimeline } from "./review-timeline.client";
import { usePostFeedback } from "./use-post-feedback";
import { useVideoPlayer } from "./use-video-player";

type ReviewWorkspaceProps = {
  secret: string;
  data: ReviewPageData;
  initialFeedbackId: string | null;
  onPlaybackError: () => void;
};

function scrollCardIntoView(feedbackId: string) {
  document
    .getElementById(`feedback-${feedbackId}`)
    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function getFeedbackLink(feedbackId: string) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set("feedback", feedbackId);
  return url.toString();
}

// The player and the list stay in step: a marker or a card seeks the Video
// and highlights the same Feedback.
export function ReviewWorkspace({
  secret,
  data,
  initialFeedbackId,
  onPlaybackError,
}: ReviewWorkspaceProps) {
  // A `?feedback=` link opens on that card, revealed even when resolved.
  const [initialFeedback] = useState(() =>
    data.feedback.find((item) => item.id === initialFeedbackId),
  );
  const [activeFeedbackId, setActiveFeedbackId] = useState(
    initialFeedback?.id ?? null,
  );
  const [showResolved, setShowResolved] = useState(
    initialFeedback ? isHiddenByDefault(initialFeedback.status) : false,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useVideoPlayer(
    videoRef,
    data.video.playbackUrl,
    data.video.durationMs,
    initialFeedback?.startMs,
  );

  useEffect(() => {
    if (initialFeedback) scrollCardIntoView(initialFeedback.id);
  }, [initialFeedback]);

  const [draft, setDraft] = useState<CommentDraft | null>(null);
  const postFeedback = usePostFeedback({
    secret,
    data,
    videoRef,
    onPosted: (feedback) => {
      setDraft(null);
      setActiveFeedbackId(feedback.id);
      requestAnimationFrame(() => scrollCardIntoView(feedback.id));
    },
  });
  const canComment = data.video.annotationsOpen;

  const { visible, hiddenCount } = listVisibleFeedback(
    data.feedback,
    showResolved,
  );
  const ownReviewerId = data.reviewer?.id ?? null;

  function selectFeedback(feedback: ReviewFeedbackItem) {
    setActiveFeedbackId(feedback.id);
    player.seek(feedback.startMs);
  }

  function handleMarkerClick(feedbackId: string) {
    const feedback = data.feedback.find((item) => item.id === feedbackId);
    if (!feedback) return;
    player.pause();
    selectFeedback(feedback);
    scrollCardIntoView(feedback.id);
  }

  function markIn() {
    player.pause();
    setDraft((current) => anchorCommentDraft(current, player.currentMs));
  }

  function markOut() {
    player.pause();
    setDraft(
      (current) => current && markCommentDraftOut(current, player.currentMs),
    );
  }

  return (
    <>
      <section className="space-y-3">
        {data.video.annotationsOpen ? null : <AnnotationsClosedBanner />}
        <ReviewPlayer
          video={data.video}
          videoRef={videoRef}
          player={player}
          onPlaybackError={onPlaybackError}
          controls={
            canComment ? (
              <CommentControls
                draft={draft}
                currentMs={player.currentMs}
                onMarkIn={markIn}
                onMarkOut={markOut}
                onClearOut={() =>
                  setDraft(
                    (current) => current && clearCommentDraftOut(current),
                  )
                }
              />
            ) : null
          }
          timeline={
            <ReviewTimeline
              durationMs={player.durationMs}
              currentMs={player.currentMs}
              feedback={visible}
              ownReviewerId={ownReviewerId}
              activeFeedbackId={activeFeedbackId}
              onSeek={player.seek}
              onMarkerClick={handleMarkerClick}
            />
          }
        />
      </section>
      <FeedbackList
        secret={secret}
        video={data.video}
        feedback={visible}
        hiddenCount={hiddenCount}
        showResolved={showResolved}
        onShowResolvedChange={setShowResolved}
        ownReviewerId={ownReviewerId}
        activeFeedbackId={activeFeedbackId}
        getFeedbackLink={getFeedbackLink}
        onSelect={selectFeedback}
        composer={
          canComment && draft ? (
            <FeedbackComposer
              draft={draft}
              isPosting={postFeedback.isPosting}
              onCommentChange={(comment) =>
                setDraft((current) => current && { ...current, comment })
              }
              onDiscard={() => setDraft(null)}
              onPost={() => postFeedback.post(draft)}
            />
          ) : null
        }
      />
      <NamePromptDialog
        open={postFeedback.namePromptOpen}
        secret={secret}
        videoId={data.video.id}
        onClaimed={postFeedback.handleClaimed}
        onCancel={postFeedback.cancelNamePrompt}
      />
    </>
  );
}
