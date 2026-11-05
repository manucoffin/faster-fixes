import { checkVideoQuota } from "@/server/auth/subscription";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { generateShareLinkSecret } from "../_helpers/share-link-secret";

type CreateVideoInput = {
  projectId: string;
  userId: string;
  file: { name: string; type: string; size: number };
  title?: string;
  media: {
    durationMs: number;
    width: number;
    height: number;
    videoCodec: string;
    hasFastStart: boolean;
  };
};

/**
 * Reserves a Video in `uploading` state before the transfer starts, so the
 * declared size counts toward the budget while the bytes are in flight. A
 * quota denial is returned rather than thrown: it carries the numbers the
 * upload dialog shows.
 */
export async function createVideo(
  { projectId, userId, file, title, media }: CreateVideoInput,
  db: typeof prisma = prisma,
) {
  const project = await db.project.findFirst({
    where: { id: projectId, organization: { members: { some: { userId } } } },
    select: { id: true, organizationId: true },
  });

  if (!project) {
    throw new ForbiddenError("You are not a member of this project.");
  }

  const quota = await checkVideoQuota(project.organizationId, file.size, db);

  if (!quota.allowed) {
    return { denial: quota.denial, video: null };
  }

  const shareLink = generateShareLinkSecret();

  const video = await db.video.create({
    data: {
      projectId: project.id,
      title: title ?? file.name.replace(/\.[^.]*$/, ""),
      filename: file.name,
      mimeType: file.type,
      size: BigInt(file.size),
      ...media,
      shareTokenHash: shareLink.hash,
      shareTokenEncrypted: shareLink.encrypted,
      uploadedById: userId,
    },
    select: { id: true, projectId: true },
  });

  return { denial: null, video };
}

export type CreateVideoOutput = Awaited<ReturnType<typeof createVideo>>;
