import type { PageParams } from "@/types/next";
import { VideoReview } from "./_features/video-review/video-review.client";

// Only the shell: the review surface reads everything from the review API, so
// the page and the API answer a replaced link the same way.
export default async function ReviewPage({
  params,
  searchParams,
}: PageParams<{ secret: string }>) {
  const [{ secret }, { feedback }] = await Promise.all([params, searchParams]);

  return (
    <VideoReview
      secret={secret}
      initialFeedbackId={typeof feedback === "string" ? feedback : null}
    />
  );
}
