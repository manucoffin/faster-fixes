import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { getAppUrl } from "@/utils/url/get-app-url";
import { prisma } from "@workspace/db";
import { toVideoRow, videoRowSelect } from "./_video-row";
import type { ListVideosInput } from "./list-videos.schema";

/** The Project's Videos, newest first, as the Videos list shows them. */
export async function listVideos(
  { projectId, userId }: ListVideosInput & { userId: string },
  db: typeof prisma = prisma,
) {
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

  const videos = await db.video.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: videoRowSelect,
  });

  // The Delete dialog names every Feedback going with the Video, whatever its
  // Status, which the row's open count does not cover.
  const feedbackCounts = await db.feedback.groupBy({
    by: ["videoId"],
    where: { videoId: { in: videos.map(({ id }) => id) } },
    _count: { _all: true },
  });
  const feedbackCountByVideoId = new Map(
    feedbackCounts.map(({ videoId, _count }) => [videoId, _count._all]),
  );

  const appUrl = getAppUrl();

  return Promise.all(
    videos.map(async (video) => ({
      ...(await toVideoRow(video, appUrl)),
      feedbackCount: feedbackCountByVideoId.get(video.id) ?? 0,
    })),
  );
}

export type ListVideosOutput = Awaited<ReturnType<typeof listVideos>>;
