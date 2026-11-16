import { getTrelloLinkHealth } from "./get-trello-link-health";
import { prisma } from "@workspace/db";

/**
 * Re-reads the linked board, stores the link's health when it changed, and
 * returns it. Re-reading rather than trusting the stored issue is what resumes
 * card creation once the board is fixed in Trello. A Trello failure is
 * rethrown and leaves the stored issue as it is, and so does an Installation
 * that needs re-authorization.
 */
export async function refreshTrelloLinkHealth(projectTrelloLinkId: string) {
  const link = await prisma.projectTrelloLink.findUniqueOrThrow({
    where: { id: projectTrelloLinkId },
    include: {
      trelloInstallation: {
        select: { organizationId: true, healthState: true },
      },
    },
  });

  // The grant is dead, so Trello cannot tell anything about the board.
  if (link.trelloInstallation.healthState !== "connected") {
    return link.linkHealthIssue;
  }

  const linkHealthIssue = await getTrelloLinkHealth(
    link.trelloInstallation.organizationId,
    link,
  );

  if (linkHealthIssue !== link.linkHealthIssue) {
    await prisma.projectTrelloLink.update({
      where: { id: link.id },
      data: { linkHealthIssue },
    });
  }

  return linkHealthIssue;
}
