import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import type { ListFeedbackInput } from "./list-feedback.schema";

export async function listFeedback(
  { projectId, userId }: ListFeedbackInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const feedback = await db.feedback.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true } },
      assignee: {
        select: {
          id: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
      screenshot: {
        select: { id: true, key: true, provider: true, bucket: true },
      },
      issueLink: {
        select: {
          issueNumber: true,
          issueUrl: true,
          issueState: true,
        },
      },
      linearIssueLink: {
        select: {
          issueId: true,
          issueIdentifier: true,
          issueUrl: true,
          issueStateType: true,
        },
      },
      jiraIssueLink: {
        select: {
          issueId: true,
          issueKey: true,
          issueUrl: true,
          issueStatusCategory: true,
        },
      },
    },
  });

  return Promise.all(
    feedback.map(async (f) => ({
      id: f.id,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      status: f.status,
      comment: f.comment,
      pageUrl: f.pageUrl,
      clickX: f.clickX,
      clickY: f.clickY,
      selector: f.selector,
      browserName: f.browserName,
      browserVersion: f.browserVersion,
      os: f.os,
      viewportWidth: f.viewportWidth,
      viewportHeight: f.viewportHeight,
      reviewer: f.reviewer,
      assignee: f.assignee
        ? {
            id: f.assignee.id,
            name: f.assignee.user.name,
            image: f.assignee.user.image,
          }
        : null,
      screenshotUrl: f.screenshot
        ? await getSignedAssetUrl(f.screenshot)
        : null,
      metadata: f.metadata as Record<string, unknown> | null,
      issueLink: f.issueLink,
      linearIssueLink: f.linearIssueLink,
      jiraIssueLink: f.jiraIssueLink,
    })),
  );
}

export type ListFeedbackOutput = Awaited<ReturnType<typeof listFeedback>>;
