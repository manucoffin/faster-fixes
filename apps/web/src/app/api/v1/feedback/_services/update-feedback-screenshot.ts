import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";

type UpdateFeedbackScreenshotInput = {
  feedbackId: string;
  /** The Asset `createFeedbackScreenshot` stored the image under. */
  screenshotId: string;
};

/**
 * Points a Feedback at the Asset just stored and answers with the signed URL
 * the widget displays. The URL comes from the row the write returns rather than
 * from the input, so a Feedback that comes back without its Asset answers with
 * no URL instead of failing.
 */
export async function updateFeedbackScreenshot({
  feedbackId,
  screenshotId,
}: UpdateFeedbackScreenshotInput) {
  const updated = await prisma.feedback.update({
    where: { id: feedbackId },
    data: { screenshotId },
    include: {
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  const screenshotUrl = updated.screenshot
    ? await getSignedAssetUrl(updated.screenshot)
    : null;

  return { screenshotUrl };
}

export type UpdateFeedbackScreenshotOutput = Awaited<
  ReturnType<typeof updateFeedbackScreenshot>
>;
