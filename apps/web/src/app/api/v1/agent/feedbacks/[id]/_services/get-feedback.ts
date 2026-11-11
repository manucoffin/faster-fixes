import { toAgentFeedbackItem } from "@/app/_domains/feedback/_helpers/agent-feedback-serializer";
import { refreshFeedbackRecording } from "@/app/_domains/feedback/_services/refresh-feedback-recording";
import { NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";

type GetFeedbackInput = {
  feedbackId: string;
  /** The projects the Agent token's Organization owns: the read's whole scope. */
  organizationProjects: Array<{ id: string }>;
};

/**
 * One Feedback for an Agent token, page or Video alike: the listing's item
 * plus `recording`, its steps derived on the first read and cached after.
 */
export async function getFeedback(
  { feedbackId, organizationProjects }: GetFeedbackInput,
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findFirst({
    where: {
      id: feedbackId,
      projectId: { in: organizationProjects.map((p) => p.id) },
    },
    include: {
      reviewer: { select: { name: true } },
      video: { select: { title: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
      recording: { select: { key: true } },
    },
  });

  if (!feedback) {
    // No period: this copy is the published agent API contract.
    throw new NotFoundError("Feedback not found");
  }

  const [screenshotUrl, recording] = await Promise.all([
    feedback.screenshot ? getSignedAssetUrl(feedback.screenshot) : null,
    refreshFeedbackRecording(feedback, db),
  ]);

  return {
    item: {
      ...toAgentFeedbackItem(feedback, screenshotUrl),
      recording,
    },
    // Not part of the JSON item: the Markdown rendering names the Video.
    videoTitle: feedback.video?.title ?? null,
  };
}

export type GetFeedbackOutput = Awaited<ReturnType<typeof getFeedback>>;
