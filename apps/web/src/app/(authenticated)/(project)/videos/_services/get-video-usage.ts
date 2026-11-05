import type { VideoUsage } from "@/app/_domains/video/_helpers/format-video-usage";
import { resolveOrganizationPlan } from "@/server/auth/subscription";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { isCloud } from "@/utils/environment/env";
import { prisma } from "@workspace/db";
import type { GetVideoUsageInput } from "./get-video-usage.schema";

/**
 * The Organization's video usage across all its Projects, counted the way the
 * quota check counts it: `uploading` rows included. A self-hosted instance has
 * no quota, so it answers `isCloud: false` alone.
 */
export async function getVideoUsage(
  { projectId, userId }: GetVideoUsageInput & { userId: string },
  db: typeof prisma = prisma,
): Promise<({ isCloud: true } & VideoUsage) | { isCloud: false }> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("You are not a member of this project.");
  }

  if (!isCloud()) {
    return { isCloud: false };
  }

  const where = { project: { organizationId: project.organizationId } };
  const [{ planName, limits }, videoCount, { _sum }] = await Promise.all([
    resolveOrganizationPlan(project.organizationId, db),
    db.video.count({ where }),
    db.video.aggregate({ where, _sum: { size: true } }),
  ]);

  return {
    isCloud: true,
    plan: planName,
    videoCount,
    // Infinity does not cross the transport.
    videoLimit: limits.videos === Infinity ? null : limits.videos,
    usedBytes: Number(_sum.size ?? 0),
    budgetBytes: limits.videoStorage,
    fileSizeCapBytes: limits.videoFileSize,
  };
}

export type GetVideoUsageOutput = Awaited<ReturnType<typeof getVideoUsage>>;
