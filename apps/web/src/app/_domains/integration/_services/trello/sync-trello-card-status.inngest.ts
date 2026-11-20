import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { trelloWebhookCardEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { applyObservedIssueState } from "../apply-observed-issue-state";
import { trelloTrackerAdapter } from "./_trello-tracker-adapter";

export const syncTrelloCardStatus = inngest.createFunction(
  {
    id: "sync-trello-card-status",
    retries: 3,
    concurrency: { key: "event.data.cardId", limit: 1 },
    triggers: [{ event: trelloWebhookCardEvent }],
  },
  async ({ event }) => {
    const { projectTrelloLinkId, cardId } = event.data;

    // The adapter maps through the link's lists, so it is built for the link.
    const link = await prisma.projectTrelloLink.findUnique({
      where: { id: projectTrelloLinkId },
      select: {
        boardId: true,
        newListId: true,
        inProgressListId: true,
        resolvedListId: true,
        trelloInstallation: { select: { organizationId: true } },
      },
    });
    if (!link) return { skipped: "no_matching_issue_link" };

    const { trelloInstallation, ...board } = link;

    // A deleted card, or one moved to another board, is confirmed by the
    // re-read, so the delivery carries no deletion flag.
    return applyObservedIssueState(
      { reference: { tracker: "trello", cardId, projectTrelloLinkId } },
      trelloTrackerAdapter(
        { ...board, organizationId: trelloInstallation.organizationId },
        prisma,
      ),
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );
  },
);
