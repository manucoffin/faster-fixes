import { inngest } from "@/server/inngest";
import {
  buildEvent,
  feedbackStatusChangedEvent,
} from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import type { StatusConvergence } from "./update-status";

/** The production dependencies of Status convergence: Prisma and Inngest. */
export function prismaStatusConvergence(
  db: typeof prisma = prisma,
): StatusConvergence {
  return {
    store: {
      async writeStatuses({ feedbackIds, status, from }) {
        const written = await db.feedback.updateManyAndReturn({
          where: {
            id: { in: feedbackIds },
            ...(from && { status: { in: from } }),
          },
          data: { status },
          select: { id: true },
        });
        return written.map((feedback) => feedback.id);
      },
    },
    sendEvents(events) {
      // Fire-and-forget, one event per Feedback so each Tracker sync gets its
      // own retries: a failed send never fails the Status change.
      inngest
        .send(
          events.map((data) => buildEvent(feedbackStatusChangedEvent, data)),
        )
        .catch(() => {});
    },
  };
}
