"use client";

import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";
import { useVideoPlayer } from "@/app/_domains/video/video-player/use-video-player";
import { VideoPlayer } from "@/app/_domains/video/video-player/video-player.client";
import {
  VideoTimeline,
  type VideoTimelineMarker,
} from "@/app/_domains/video/video-player/video-timeline.client";
import { AnnotationsClosedBanner } from "../../_components/annotations-closed-banner";
import {
  anchorCommentDraft,
  clearCommentDraftOut,
  markCommentDraftFrame,
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
import type { VideoSelection } from "@/app/_domains/video/_types/video-selection";
import { CommentControls } from "./comment-controls.client";
import { FeedbackComposer } from "./feedback-composer.client";
import { FeedbackList } from "./feedback-list.client";
import { FrameOverlay } from "./frame-overlay.client";
import { NamePromptDialog } from "./name-prompt-dialog.client";
import { usePostFeedback } from "./use-post-feedback";

type ReviewWorkspaceProps = {
  secret: string;
  data: ReviewPageData;
  initialFeedbackId: string | null;
  onPlaybackError: () => void;
};

function toTimelineMarker(
  feedback: ReviewFeedbackItem,
  isOwn: boolean,
): VideoTimelineMarker {
  let colorClassName = isOwn ? "bg-foreground" : "bg-foreground/50";
  if (isHiddenByDefault(feedback.status)) colorClassName = "bg-success";
  return {
    id: feedback.id,
    startMs: feedback.startMs,
    endMs: feedback.endMs,
    colorClassName,
    raised: isOwn,
  };
}

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
  const isMobile = useIsMobile();

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

  function markFrame(selection: VideoSelection) {
    player.pause();
    setDraft((current) =>
      markCommentDraftFrame(current, player.currentMs, selection),
    );
  }

  const composer =
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
    ) : null;
  // A draft floats over the frame, where the Reviewer is looking; on a phone,
  // where the frame is too small to type over, it heads the list.
  const floatsOnFrame = !isMobile && draft !== null;

  return (
    <>
      <section className="space-y-3">
        {data.video.annotationsOpen ? null : <AnnotationsClosedBanner />}
        <VideoPlayer
          video={data.video}
          videoRef={videoRef}
          player={player}
          onPlaybackError={onPlaybackError}
          overlay={
            canComment ? (
              <FrameOverlay
                frame={{
                  width: data.video.width ?? 16,
                  height: data.video.height ?? 9,
                }}
                selection={draft}
                paused={player.paused}
                popover={floatsOnFrame ? composer : null}
                onMark={markFrame}
                onPause={player.pause}
              />
            ) : null
          }
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
            <VideoTimeline
              durationMs={player.durationMs}
              currentMs={player.currentMs}
              markers={visible.map((item) =>
                toTimelineMarker(item, item.reviewer.id === ownReviewerId),
              )}
              activeMarkerId={activeFeedbackId}
              draftRange={canComment ? draft : null}
              onSeek={player.seek}
              onMarkerClick={handleMarkerClick}
            />
          }
        />
        {canComment && !draft ? (
          <p className="text-sm text-muted-foreground">
            Pause and click the frame to mark a point, or drag to outline an
            area. Mark in and out to comment on a section.
          </p>
        ) : null}
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
        composer={floatsOnFrame ? null : composer}
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
