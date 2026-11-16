import { withTrelloAccessToken } from "@/app/_domains/integration/_services/trello/token-access";
import { listOpenBoards } from "@/app/_domains/integration/_services/trello/trello-client";
import { prisma } from "@workspace/db";
import { getTrelloAccess } from "./get-trello-access";
import type { ListAccessibleTrelloBoardsInput } from "./list-accessible-trello-boards.schema";

export async function listAccessibleTrelloBoards(
  { projectId, userId }: ListAccessibleTrelloBoardsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { organizationId } = await getTrelloAccess(
    { userId, projectId, requireAdmin: false },
    db,
  );

  return withTrelloAccessToken(organizationId, listOpenBoards);
}

export type ListAccessibleTrelloBoardsOutput = Awaited<
  ReturnType<typeof listAccessibleTrelloBoards>
>;
