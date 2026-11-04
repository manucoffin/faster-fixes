import { VideoReviewPrototype } from "./_features/video-review-prototype.client";
import {
  parseReviewPageState,
  parseVariantKey,
} from "./_features/prototype-options";

type VideoReviewPrototypePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// PROTOTYPE: three variants of the Reviewer review page, switchable via
// `?variant=A|B|C`, with the page states behind `?state=open|closed|revoked`.
export default async function VideoReviewPrototypePage({
  searchParams,
}: VideoReviewPrototypePageProps) {
  const { variant, state } = await searchParams;
  return (
    <VideoReviewPrototype
      variant={parseVariantKey(variant)}
      state={parseReviewPageState(state)}
    />
  );
}
