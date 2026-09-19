import type { FeedbackStatus } from "@/app/_domains/feedback/_types/feedback-status";
import { NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import type { DiagnosticTrail } from "@fasterfixes/core";
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
    feedbacks.map(async (f) => ({
      id: f.id,
      status: f.status,
      comment: f.comment,
      pageUrl: f.pageUrl,
      selector: f.selector,
      clickX: f.clickX,
      clickY: f.clickY,
      viewportWidth: f.viewportWidth,
      viewportHeight: f.viewportHeight,
      browserName: f.browserName,
      browserVersion: f.browserVersion,
      os: f.os,
      screenshotUrl: f.screenshot
        ? await getSignedAssetUrl(f.screenshot)
        : null,
      metadata: f.metadata as Record<string, unknown> | null,
      diagnosticTrail: f.diagnosticTrail as DiagnosticTrail | null,
      reviewerName: f.reviewer.name,
      createdAt: f.createdAt,
    })),
  );

  // `projectId` travels back so the boundary can name the resolved Project in
  // its access log without resolving the identifier a second time.
  return { projectId, items };
}

export type ListFeedbacksOutput = Awaited<ReturnType<typeof listFeedbacks>>;
