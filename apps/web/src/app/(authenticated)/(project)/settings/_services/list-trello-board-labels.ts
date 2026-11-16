import { withTrelloAccessToken } from "@/app/_domains/integration/_services/trello/token-access";
import { listBoardLabels } from "@/app/_domains/integration/_services/trello/trello-client";
import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { getTrelloAccess } from "./get-trello-access";
import type { ListTrelloBoardLabelsInput } from "./list-trello-board-labels.schema";

// Reads the board from the link rather than the input, so the label editor can
// only offer the linked board's labels.
export async function listTrelloBoardLabels(
  { projectId, userId }: ListTrelloBoardLabelsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId } = await getTrelloAccess(
    { userId, projectId, requireAdmin: false },
    db,
  );

  const link = await db.projectTrelloLink.findUnique({
    where: { projectId },
    select: { boardId: true },
  });

  if (!link) {
    throw new NotFoundError("This project is not linked to a Trello board.");
  }

  return withTrelloAccessToken(organizationId, (accessToken) =>
    listBoardLabels(accessToken, link.boardId),
  );
}

export type ListTrelloBoardLabelsOutput = Awaited<
  ReturnType<typeof listTrelloBoardLabels>
>;
