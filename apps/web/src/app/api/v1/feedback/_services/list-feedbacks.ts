import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";

type ListFeedbacksInput = {
  projectId: string;
  /** The page the widget is open on. Omitted → the whole Project. */
  pageUrl?: string;
};

/**
 * The Feedback a Reviewer sees in the widget, newest first, each with a signed
 * screenshot URL. The caller has already resolved the Project, matched the
 * origin and checked the Reviewer token, so this read applies no access rule of
 * its own.
 */
export async function listFeedbacks({
  projectId,
  pageUrl,
}: ListFeedbacksInput) {
  const feedbackList = await prisma.feedback.findMany({
    where: {
      projectId,
      ...(pageUrl ? { pageUrl } : {}),
    },
    orderBy: { createdAt: "desc" },
    // Keep the heavy Diagnostic Trail out of the widget's hot read path.
    omit: { diagnosticTrail: true },
    include: {
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  return Promise.all(
    feedbackList.map(async (f) => ({
      id: f.id,
      status: f.status,
      comment: f.comment,
      pageUrl: f.pageUrl,
      clickX: f.clickX,
      clickY: f.clickY,
      selector: f.selector,
      screenshotUrl: f.screenshot
        ? await getSignedAssetUrl(f.screenshot)
        : null,
      metadata: f.metadata,
      reviewer: f.reviewer,
      createdAt: f.createdAt,
    })),
  );
}

export type ListFeedbacksOutput = Awaited<ReturnType<typeof listFeedbacks>>;
