import { withTrelloAccessToken } from "@/app/_domains/integration/_services/trello/token-access";
import { listOpenBoardLists } from "@/app/_domains/integration/_services/trello/trello-client";
import { prisma } from "@workspace/db";
import { getTrelloAccess } from "./get-trello-access";
import type { ListTrelloBoardListsInput } from "./list-trello-board-lists.schema";

export async function listTrelloBoardLists(
  {
    projectId,
    boardId,
    userId,
  }: ListTrelloBoardListsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId } = await getTrelloAccess(
    { userId, projectId, requireAdmin: false },
    db,
  );

  return withTrelloAccessToken(organizationId, (accessToken) =>
    listOpenBoardLists(accessToken, boardId),
  );
}

export type ListTrelloBoardListsOutput = Awaited<
  ReturnType<typeof listTrelloBoardLists>
>;
