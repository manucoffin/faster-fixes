import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";

type SignableScreenshot = {
  key: string;
  provider: string;
  bucket: string;
};

type FeedbackWithScreenshot = {
  screenshot: SignableScreenshot | null;
};

/**
 * Mints a fresh short-TTL signed URL for a feedback's screenshot. Callers (e.g.
 * Inngest) sign right before posting because signed asset URLs are short-lived.
 * Returns null when the feedback has no screenshot.
 */
export async function getFreshScreenshotUrl(
  feedback: FeedbackWithScreenshot,
): Promise<string | null> {
  if (!feedback.screenshot) {
    return null;
  }

  return getSignedAssetUrl(feedback.screenshot);
}

export type GetFreshScreenshotUrlOutput = Awaited<
  ReturnType<typeof getFreshScreenshotUrl>
>;
