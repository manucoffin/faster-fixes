import type { UpdateVideoFeedbackInput } from "@/app/_domains/feedback/_services/create-video-feedback.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readReviewerIdentity } from "../../_helpers/reviewer-identity";
import type {
  ReviewFeedbackItem,
  ReviewPageData,
} from "../../_types/review-page-data";
import { getReviewPageQueryKey } from "./use-review-page-query";
import { ReviewRequestError, sendReviewRequest } from "./send-review-request";

// Refusals that mean the card is stale: the Feedback moved past `new` or is
// gone, the Video was closed, the identity no longer matches, or the link was
// replaced. The read then redraws the page as it now stands.
const STALE_CARD_CODES = new Set([
  "feedback_not_found",
  "annotations_closed",
  "reviewer_required",
  "link_not_found",
]);

type UseOwnFeedbackMutationsOptions = {
  secret: string;
  videoId: string;
  feedbackId: string;
};

/** Edit and withdrawal of the Reviewer's own `new` Feedback from its card. */
export function useOwnFeedbackMutations({
  secret,
  videoId,
  feedbackId,
}: UseOwnFeedbackMutationsOptions) {
  const queryClient = useQueryClient();
  const queryKey = getReviewPageQueryKey(secret);
  const path = `/feedbacks/${encodeURIComponent(feedbackId)}`;

  function updatePageData(update: (page: ReviewPageData) => ReviewPageData) {
    queryClient.setQueryData<ReviewPageData | null>(queryKey, (page) =>
      page ? update(page) : page,
    );
  }

  function getReviewerHeaders(): Record<string, string> {
    const identity = readReviewerIdentity(window.localStorage, videoId);
    return identity ? { "x-reviewer-token": identity.secret } : {};
  }

  function handleError(error: Error) {
    if (
      error instanceof ReviewRequestError &&
      STALE_CARD_CODES.has(error.code ?? "")
    ) {
      void queryClient.invalidateQueries({ queryKey });
    }
    toast.error(error.message);
  }

  const editFeedback = useMutation({
    mutationFn: ({ comment }: UpdateVideoFeedbackInput) =>
      sendReviewRequest<ReviewFeedbackItem>(secret, path, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...getReviewerHeaders(),
        },
        body: JSON.stringify({ comment }),
      }),
    onSuccess: (updated) => {
      updatePageData((page) => ({
        ...page,
        feedback: page.feedback.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
    },
    onError: handleError,
  });

  const deleteFeedback = useMutation({
    mutationFn: () =>
      sendReviewRequest<null>(secret, path, {
        method: "DELETE",
        headers: getReviewerHeaders(),
      }),
    onSuccess: () => {
      updatePageData((page) => ({
        ...page,
        feedback: page.feedback.filter((item) => item.id !== feedbackId),
      }));
    },
    onError: handleError,
  });

  return { editFeedback, deleteFeedback };
}
