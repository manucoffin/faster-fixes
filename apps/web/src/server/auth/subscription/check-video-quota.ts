import { isCloud } from "@/utils/environment/env";
import type { PrismaClient } from "@workspace/db/types";
import { resolveOrganizationPlan } from "./resolve-organization-plan";

export type VideoQuotaDenial =
  | { kind: "videoCount"; count: number; limit: number }
  | { kind: "videoFileSize"; size: number; cap: number }
  | { kind: "videoStorage"; used: number; budget: number };

export type VideoQuotaResult =
  | { allowed: true }
  | { allowed: false; denial: VideoQuotaDenial };

// May this Organization add a Video of `declaredSize` bytes. Rows in both
// states count, so concurrent uploads cannot race past the budget. The commit
// excludes the Video it is checking, whose declared size the real one replaces.
export async function checkVideoQuota(
  organizationId: string,
  declaredSize: number,
  prisma: PrismaClient,
  { excludeVideoId }: { excludeVideoId?: string } = {},
): Promise<VideoQuotaResult> {
  // A self-hosted instance stores on its own disk: no video quota at all.
  if (!isCloud()) {
    return { allowed: true };
  }

  const { limits } = await resolveOrganizationPlan(organizationId, prisma);

  if (declaredSize > limits.videoFileSize) {
    return {
      allowed: false,
      denial: {
        kind: "videoFileSize",
        size: declaredSize,
        cap: limits.videoFileSize,
      },
    };
  }

  const where = {
    project: { organizationId },
    ...(excludeVideoId ? { id: { not: excludeVideoId } } : {}),
  };

  if (limits.videos !== Infinity) {
    const count = await prisma.video.count({ where });
    if (count >= limits.videos) {
      return {
        allowed: false,
        denial: { kind: "videoCount", count, limit: limits.videos },
      };
    }
  }

  const { _sum } = await prisma.video.aggregate({
    where,
    _sum: { size: true },
  });
  const used = Number(_sum.size ?? 0);

  if (used + declaredSize > limits.videoStorage) {
    return {
      allowed: false,
      denial: { kind: "videoStorage", used, budget: limits.videoStorage },
    };
  }

  return { allowed: true };
}
