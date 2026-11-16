import { refreshTrelloLinkHealth } from "@/app/_domains/integration/_services/trello/refresh-trello-link-health";
import { prisma } from "@workspace/db";
import { getProjectTrelloLink } from "./get-project-trello-link";
import type { GetProjectTrelloLinkInput } from "./get-project-trello-link.schema";

/**
 * The Project link as the settings show it, with its health re-read from
 * Trello on every visit, so a board reopened or shared again in Trello clears
 * its issue without a remap. The settings never fail on Trello: when the board
 * cannot be read, the stored issue stands.
 */
export async function refreshProjectTrelloLink(
  input: GetProjectTrelloLinkInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const link = await getProjectTrelloLink(input, db);
  if (!link) return null;

  const linkHealthIssue = await refreshTrelloLinkHealth(link.id).catch(
    () => link.linkHealthIssue,
  );

  return { ...link, linkHealthIssue };
}
