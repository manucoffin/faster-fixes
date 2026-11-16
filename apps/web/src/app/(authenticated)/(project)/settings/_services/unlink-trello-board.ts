import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UnlinkTrelloBoardInput } from "./unlink-trello-board.schema";

// Not plan-gated, so a downgraded Organization can always unlink, and not
// through getTrelloAccess, so unlinking still works while the Installation
// needs re-authorization. The cards stay on Trello: deleting the link cascades
// to its Issue links and writes nothing to the board.
export async function unlinkTrelloBoard(
  { projectId, userId }: UnlinkTrelloBoardInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Privileged membership in the Project's Organization needs the loaded
  // Project, so the denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only owners and admins can unlink Trello boards.",
    );
  }

  await db.projectTrelloLink.deleteMany({ where: { projectId } });

  return { success: true };
}
