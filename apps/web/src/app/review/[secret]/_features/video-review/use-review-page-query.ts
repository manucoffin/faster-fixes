import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readReviewerIdentity } from "../../_helpers/reviewer-identity";
import type { ReviewPageData } from "../../_types/review-page-data";

// The signed playback URL lasts an hour: refetching before it lapses keeps
// seeking working on a page left open.
const PLAYBACK_URL_REFRESH_MS = 50 * 60 * 1000;

/**
 * The review API's read for a Share link. Resolves to null when the link no
 * longer opens a Video, so the page renders that as its empty state.
 */
async function fetchReviewPage(
  secret: string,
  reviewerSecret: string | null,
): Promise<ReviewPageData | null> {
  const response = await fetch(`/api/v1/review/${encodeURIComponent(secret)}`, {
    cache: "no-store",
    headers: reviewerSecret ? { "x-reviewer-token": reviewerSecret } : {},
  });

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return body as ReviewPageData;

  const error = body as { error?: string; code?: string } | null;
  if (error?.code === "link_not_found") return null;
  throw new Error(error?.error ?? "Something went wrong. Please try again.");
}

function readStoredReviewerSecret(videoId: string) {
  return readReviewerIdentity(window.localStorage, videoId)?.secret ?? null;
}

/**
 * The identity is stored per Video id, which the first read is what reveals:
 * a returning browser reads once more with its token so the page knows which
 * Feedback is its own. Later reads send the token straight away.
 */
async function fetchReviewPageAsReviewer(
  secret: string,
  knownVideoId: string | undefined,
) {
  if (knownVideoId) {
    return fetchReviewPage(secret, readStoredReviewerSecret(knownVideoId));
  }

  const data = await fetchReviewPage(secret, null);
  if (!data) return data;
  const reviewerSecret = readStoredReviewerSecret(data.video.id);
  return reviewerSecret ? fetchReviewPage(secret, reviewerSecret) : data;
}

export function useReviewPageQuery(secret: string) {
  const queryClient = useQueryClient();
  const queryKey = ["review-page", secret];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const previous = queryClient.getQueryData<ReviewPageData>(queryKey);
      try {
        return await fetchReviewPageAsReviewer(secret, previous?.video.id);
      } catch (error) {
        // A failed background refresh keeps the page on screen rather than
        // replacing the player with an error.
        if (previous) return previous;
        throw error;
      }
    },
    refetchInterval: PLAYBACK_URL_REFRESH_MS,
    refetchIntervalInBackground: true,
    // Every read signs a new playback URL, and a new URL reloads the video.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
