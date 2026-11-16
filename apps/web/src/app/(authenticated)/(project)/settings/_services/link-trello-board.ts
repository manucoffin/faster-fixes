import { checkFeatureAccess } from "@/server/auth/subscription";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { getTrelloAccess } from "./get-trello-access";
import type { LinkTrelloBoardInput } from "./link-trello-board.schema";
import { TrelloListMappingSchema } from "./trello-list-mapping.schema";

export async function linkTrelloBoard(
  {
    projectId,
    boardId,
    boardName,
    boardUrl,
    newListId,
    inProgressListId,
    resolvedListId,
    userId,
  }: LinkTrelloBoardInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId, installation } = await getTrelloAccess(
    {
      userId,
      projectId,
      requireAdmin: true,
      adminDeniedMessage: "Only owners and admins can link Trello boards.",
    },
    db,
  );

  // Enforced here rather than by the tRPC middleware so the gate holds for
  // every transport that links a board.
  const featureAccess = await checkFeatureAccess(
    organizationId,
    "trelloIntegration",
    db,
  );

  if (!featureAccess.allowed) {
    throw new ForbiddenError(
      "Trello integration is available on paid plans. Upgrade your plan to link a Trello board.",
    );
  }

  const mapping = TrelloListMappingSchema.safeParse({
    newListId,
    inProgressListId,
    resolvedListId,
  });

  if (!mapping.success) {
    throw new BadRequestError(
      mapping.error.issues[0]?.message ?? "Invalid list mapping.",
    );
  }

  // Changing the board means unlinking first, which makes it obvious that the
  // existing cards stop being tracked.
  const existingLink = await db.projectTrelloLink.findUnique({
    where: { projectId },
    select: { id: true },
  });

  if (existingLink) {
    throw new ConflictError(
      "This project is already linked to a Trello board. Unlink it to choose another board.",
    );
  }

  const link = await db.projectTrelloLink.create({
    data: {
      projectId,
      trelloInstallationId: installation.id,
      boardId,
      boardName,
      boardUrl,
      newListId: mapping.data.newListId,
      inProgressListId: mapping.data.inProgressListId,
      resolvedListId: mapping.data.resolvedListId,
    },
    select: { id: true },
  });

  return { id: link.id };
}

export type LinkTrelloBoardOutput = Awaited<ReturnType<typeof linkTrelloBoard>>;
