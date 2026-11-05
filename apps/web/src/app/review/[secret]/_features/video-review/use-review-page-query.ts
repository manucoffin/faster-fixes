import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReviewPageData } from "../../_types/review-page-data";

// The signed playback URL lasts an hour: refetching before it lapses keeps
// seeking working on a page left open.
const PLAYBACK_URL_REFRESH_MS = 50 * 60 * 1000;

/**
 * The review API's read for a Share link. Resolves to null when the link no
 * longer opens a Video, so the page renders that as its empty state.
 */
async function fetchReviewPage(secret: string): Promise<ReviewPageData | null> {
  const response = await fetch(`/api/v1/review/${encodeURIComponent(secret)}`, {
    cache: "no-store",
  });

  const body: unknown = await response.json().catch(() => null);
  if (response.ok) return body as ReviewPageData;

  const error = body as { error?: string; code?: string } | null;
  if (error?.code === "link_not_found") return null;
  throw new Error(error?.error ?? "Something went wrong. Please try again.");
}

export function useReviewPageQuery(secret: string) {
  const queryClient = useQueryClient();
  const queryKey = ["review-page", secret];

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await fetchReviewPage(secret);
      } catch (error) {
        // A failed background refresh keeps the page on screen rather than
        // replacing the player with an error.
        const previous = queryClient.getQueryData<ReviewPageData>(queryKey);
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
