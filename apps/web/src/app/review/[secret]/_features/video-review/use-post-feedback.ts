import { CreateVideoFeedbackSchema } from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { getBrowserInfo } from "@fasterfixes/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type RefObject } from "react";
import { toast } from "sonner";
import { captureFrame } from "../../_helpers/capture-frame";
import type { CommentDraft } from "../../_helpers/comment-draft";
import {
  readReviewerIdentity,
  type ReviewerIdentity,
} from "../../_helpers/reviewer-identity";
import type {
  ReviewFeedbackItem,
  ReviewPageData,
} from "../../_types/review-page-data";
import { getReviewPageQueryKey } from "./use-review-page-query";
import { ReviewRequestError, sendReviewRequest } from "./send-review-request";

// A seek that never settles (a stalled network) must not hold the Post: the
// Feedback then goes out with whatever frame is on screen.
const SEEK_TIMEOUT_MS = 3000;

function seekVideo(video: HTMLVideoElement, ms: number) {
  if (Math.abs(video.currentTime * 1000 - ms) < 1) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, SEEK_TIMEOUT_MS);
    video.addEventListener(
      "seeked",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    video.currentTime = ms / 1000;
  });
}

async function captureFrameAt(video: HTMLVideoElement | null, ms: number) {
  if (!video) return null;
  await seekVideo(video, ms);
  return captureFrame(video);
}

type UsePostFeedbackOptions = {
  secret: string;
  data: ReviewPageData;
  videoRef: RefObject<HTMLVideoElement | null>;
  onPosted: (feedback: ReviewFeedbackItem) => void;
};

/**
 * Posts a draft as a Feedback. A browser with no Reviewer on this Video is
 * asked for a name first, and the draft waits for the claim; the frame at the
 * in point goes along as the Screenshot when it can be captured.
 */
export function usePostFeedback({
  secret,
  data,
  videoRef,
  onPosted,
}: UsePostFeedbackOptions) {
  const queryClient = useQueryClient();
  const queryKey = getReviewPageQueryKey(secret);
  const [pendingDraft, setPendingDraft] = useState<CommentDraft | null>(null);

  function updatePageData(update: (page: ReviewPageData) => ReviewPageData) {
    queryClient.setQueryData<ReviewPageData | null>(queryKey, (page) =>
      page ? update(page) : page,
    );
  }

  const postFeedback = useMutation({
    mutationFn: async ({
      draft,
      identity,
    }: {
      draft: CommentDraft;
      identity: ReviewerIdentity;
    }) => {
      const payload = CreateVideoFeedbackSchema.safeParse({
        comment: draft.comment,
        startMs: draft.startMs,
        endMs: draft.endMs,
        point: draft.point,
        area: draft.area,
        ...getBrowserInfo(),
      });
      if (!payload.success) {
        throw new Error(payload.error.issues[0]?.message);
      }

      const body = new FormData();
      body.set("data", JSON.stringify(payload.data));
      const screenshot = await captureFrameAt(videoRef.current, draft.startMs);
      if (screenshot) body.set("screenshot", screenshot, "frame.jpg");

      return sendReviewRequest<ReviewFeedbackItem>(secret, "/feedbacks", {
        method: "POST",
        headers: { "x-reviewer-token": identity.secret },
        body,
      });
    },
    onSuccess: (feedback) => {
      updatePageData((page) => ({
        ...page,
        feedback: [...page.feedback, feedback],
      }));
      onPosted(feedback);
    },
    onError: (error, { draft }) => {
      if (error instanceof ReviewRequestError) {
        // The stored identity is unknown here (another Video's storage, or a
        // claim that never landed): claim a name again, keeping the draft.
        if (error.code === "reviewer_required") {
          setPendingDraft(draft);
          return;
        }
        // Closed since the page loaded: the read shows the banner.
        if (error.code === "annotations_closed") {
          void queryClient.invalidateQueries({ queryKey });
        }
      }
      toast.error(error.message);
    },
  });

  function post(draft: CommentDraft) {
    const identity = readReviewerIdentity(window.localStorage, data.video.id);
    if (!data.reviewer || !identity) {
      setPendingDraft(draft);
      return;
    }
    postFeedback.mutate({ draft, identity });
  }

  function handleClaimed(identity: ReviewerIdentity) {
    updatePageData((page) => ({
      ...page,
      reviewer: { id: identity.reviewerId, name: identity.name },
    }));
    if (pendingDraft) postFeedback.mutate({ draft: pendingDraft, identity });
    setPendingDraft(null);
  }

  return {
    post,
    isPosting: postFeedback.isPending,
    namePromptOpen: pendingDraft !== null,
    handleClaimed,
    cancelNamePrompt: () => setPendingDraft(null),
  };
}
