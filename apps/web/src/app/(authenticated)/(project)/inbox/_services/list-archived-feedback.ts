import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import type { ListArchivedFeedbackInput } from "./list-archived-feedback.schema";

export async function listArchivedFeedback(
  {
    projectId,
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    userId,
  }: ListArchivedFeedbackInput & { userId: string },
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

  const where = {
    projectId,
    status: "closed",
    ...(search
      ? { comment: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [items, totalCount] = await Promise.all([
    db.feedback.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
      },
    }),
    db.feedback.count({ where }),
  ]);

  const mappedItems = await Promise.all(
    items.map(async (f) => ({
      id: f.id,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      comment: f.comment,
      pageUrl: f.pageUrl,
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
    })),
  );

  return {
    items: mappedItems,
    totalCount,
    pageCount: Math.ceil(totalCount / pageSize),
  };
}

export type ListArchivedFeedbackOutput = Awaited<
  ReturnType<typeof listArchivedFeedback>
>;
