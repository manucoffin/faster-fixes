import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import { feedbackStatusChangedEvent } from "@/server/inngest/events";
import { prismaStatusConvergence } from "../_prisma-status-convergence";
import { convergeTracker } from "../converge-tracker";
import { trelloTrackerWriter } from "./_trello-tracker-adapter";

export const syncFeedbackStatusToTrello = inngest.createFunction(
  {
    id: "sync-feedback-status-to-trello",
    retries: 3,
    concurrency: { key: "event.data.feedbackId", limit: 1 },
    triggers: [{ event: feedbackStatusChangedEvent }],
  },
  async ({ event }) => {
    const { feedbackId, origin } = event.data;

    return convergeTracker(
      { feedbackId, origin },
      trelloTrackerWriter(prisma),
      prismaStatusConvergence(prisma, { awaitEvents: true }),
    );
  },
);
