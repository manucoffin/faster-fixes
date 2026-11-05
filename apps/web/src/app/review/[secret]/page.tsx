import type { PageParams } from "@/types/next";
import { VideoReview } from "./_features/video-review/video-review.client";

// Only the shell: the review surface reads everything from the review API, so
// the page and the API answer a replaced link the same way.
export default async function ReviewPage({
  params,
}: PageParams<{ secret: string }>) {
  const { secret } = await params;

  return <VideoReview secret={secret} />;
}
