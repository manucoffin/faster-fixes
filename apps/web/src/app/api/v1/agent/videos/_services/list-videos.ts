import { OPEN_FEEDBACK_STATUSES } from "@/app/_domains/feedback";
import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { resolveProjectId } from "../../_helpers/resolve-project-id";

type ListVideosInput = {
  /** Public ID or internal ID, as the caller sent it. */
  project: string;
  /** The projects the Agent token's Organization owns: the read's whole scope. */
  organizationProjects: Array<{ id: string; publicId: string }>;
};

/** The Project's `ready` Videos, newest first; uploads in flight are omitted. */
export async function listVideos(
  { project, organizationProjects }: ListVideosInput,
  db: typeof prisma = prisma,
) {
  const projectId = resolveProjectId(project, organizationProjects);

  if (!projectId) {
    // No period: this copy is the published agent API contract.
    throw new NotFoundError("Project not found");
  }

  const videos = await db.video.findMany({
    where: { projectId, state: "ready" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      filename: true,
      durationMs: true,
      width: true,
      height: true,
      annotationsOpen: true,
      createdAt: true,
      _count: {
        select: {
          feedback: { where: { status: { in: OPEN_FEEDBACK_STATUSES } } },
        },
      },
    },
  });

  return {
    projectId,
    videos: videos.map(({ _count, ...video }) => ({
      id: video.id,
      title: video.title,
      filename: video.filename,
      durationMs: video.durationMs,
      width: video.width,
      height: video.height,
      annotationsOpen: video.annotationsOpen,
      openFeedbackCount: _count.feedback,
      createdAt: video.createdAt,
    })),
  };
}

export type ListVideosOutput = Awaited<ReturnType<typeof listVideos>>;
