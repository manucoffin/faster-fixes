import { toAgentFeedbackItem } from "../_helpers/agent-feedback-serializer";
import { NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { refreshFeedbackRecording } from "./refresh-feedback-recording";

type GetFeedbackInput = {
  feedbackId: string;
  /** The Projects the caller may read: the read's whole scope. */
  projectIds: string[];
};

/**
 * One Feedback as the agent surface hands it out, page or Video alike: the
 * listing's item plus `recording`, its steps derived on the first read and
 * cached after. The agent route and the inbox copy share it, so the two
 * documents never disagree.
 */
export async function getFeedback(
  { feedbackId, projectIds }: GetFeedbackInput,
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findFirst({
    where: {
      id: feedbackId,
      projectId: { in: projectIds },
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
