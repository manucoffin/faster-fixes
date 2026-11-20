import type { FeedbackStatus } from "@/app/_domains/feedback";
import type {
  IssueLinkUpdate,
  StatusChangedEventData,
  StatusConvergence,
} from "./update-status";

/**
 * Status convergence over a map of Feedback Statuses, for tests: `statuses`
 * holds what was written, `issueLinks` the Issue link updates recorded with
 * it, and `events` what was emitted.
 */
export function inMemoryStatusConvergence(
  initial: Record<string, FeedbackStatus> = {},
) {
  const statuses = new Map(Object.entries(initial));
  const issueLinks: IssueLinkUpdate[] = [];
  const events: StatusChangedEventData[] = [];

  const convergence: StatusConvergence = {
    store: {
      writeStatuses({ feedbackIds, status, from, issueLink }) {
        const written = [...new Set(feedbackIds)].filter((id) => {
          const current = statuses.get(id);
          return current !== undefined && (!from || from.includes(current));
        });
        for (const id of written) statuses.set(id, status);
        if (issueLink) issueLinks.push(issueLink);
        return Promise.resolve(written);
      },
    },
    sendEvents(sent) {
      events.push(...sent);
    },
  };

  return { ...convergence, statuses, issueLinks, events };
}
