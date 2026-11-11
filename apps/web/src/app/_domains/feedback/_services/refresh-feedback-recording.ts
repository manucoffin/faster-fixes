import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import {
  type FeedbackWithRecording,
  refreshFeedbackRecordingSteps,
} from "@/server/recording/refresh-feedback-recording-steps";

/**
 * A Feedback's Recording as the agent surface hands it out: its steps, from
 * the cache when the derivation version matches, otherwise read from the file
 * and cached, plus a signed link to the file. `null` when no Recording has
 * reached the server.
 */
export async function refreshFeedbackRecording(
  feedback: FeedbackWithRecording,
  db: typeof prisma = prisma,
) {
  const recording = await refreshFeedbackRecordingSteps(feedback, db);
  if (!recording || !feedback.recording) return null;
  return { ...recording, url: await getSignedAssetUrl(feedback.recording) };
}

export type RefreshFeedbackRecordingOutput = Awaited<
  ReturnType<typeof refreshFeedbackRecording>
>;
