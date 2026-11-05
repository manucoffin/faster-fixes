import type { FeedbackStatus } from "@/app/_domains/feedback";
import { toAgentFeedbackItem } from "@/app/_domains/feedback/_helpers/agent-feedback-serializer";
import { NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { resolveProjectId } from "../../_helpers/resolve-project-id";

type ListFeedbacksInput = {
  /** Public ID or internal ID, as the caller sent it. */
  project: string;
  /** The projects the Agent token's Organization owns: the read's whole scope. */
  organizationProjects: Array<{ id: string; publicId: string }>;
  status?: FeedbackStatus;
  pageUrl?: string;
};

export async function listFeedbacks(
  { project, organizationProjects, status, pageUrl }: ListFeedbacksInput,
  db: typeof prisma = prisma,
) {
  const projectId = resolveProjectId(project, organizationProjects);

  if (!projectId) {
    // No period: this copy is the published agent API contract.
    throw new NotFoundError("Project not found");
  }

  const feedbacks = await db.feedback.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
      ...(pageUrl ? { pageUrl } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  const items = await Promise.all(
    feedbacks.map(async (f) =>
      toAgentFeedbackItem(
        f,
        f.screenshot ? await getSignedAssetUrl(f.screenshot) : null,
      ),
    ),
  );

  // `projectId` travels back so the boundary can name the resolved Project in
  // its access log without resolving the identifier a second time.
  return { projectId, items };
}

export type ListFeedbacksOutput = Awaited<ReturnType<typeof listFeedbacks>>;
