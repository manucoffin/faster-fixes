import type { FeedbackStatus } from "@/app/_domains/feedback";
import type {
  IssueLinkUpdate,
  IssueReference,
  MirroredIssueLink,
  StatusChangedEventData,
  StatusConvergence,
} from "./update-status";

/** A stored Issue link: its Feedback's Status is read from the Feedback. */
export type InMemoryIssueLink = Omit<MirroredIssueLink, "feedbackStatus"> & {
  reference: IssueReference;
};

/**
 * Status convergence over a map of Feedback Statuses, for tests: `statuses`
 * holds what was written, `issueLinks` the Issue link updates recorded with
 * it, `links` the stored Issue links, and `events` what was emitted.
 */
export function inMemoryStatusConvergence(
  initial: Record<string, FeedbackStatus> = {},
  initialLinks: InMemoryIssueLink[] = [],
) {
  const statuses = new Map(Object.entries(initial));
  const links = new Map(initialLinks.map((link) => [link.id, { ...link }]));
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
        if (issueLink) {
          issueLinks.push(issueLink);
          const stored = links.get(issueLink.id);
          if (
            stored &&
            issueLink.tracker === stored.tracker &&
            "mirroredStatus" in issueLink.data
          ) {
            const { mirroredStatus, ...issueState } = issueLink.data;
            stored.mirroredStatus = mirroredStatus;
            stored.issueState = issueState;
          }
        }
        return Promise.resolve(written);
      },
      findIssueLink(reference) {
        const stored = [...links.values()].find(
          (link) =>
            JSON.stringify(link.reference) === JSON.stringify(reference),
        );
        const feedbackStatus = stored && statuses.get(stored.feedbackId);
        if (!stored || !feedbackStatus) return Promise.resolve(null);
        const { reference: _reference, ...link } = stored;
        return Promise.resolve({ ...link, feedbackStatus });
      },
      refreshIssueState({ id, issueState }) {
        const stored = links.get(id);
        if (stored) stored.issueState = issueState;
        return Promise.resolve();
      },
      detachIssueLink(link) {
        links.delete(link.id);
        return Promise.resolve();
      },
    },
    sendEvents(sent) {
      events.push(...sent);
    },
  };

  return { ...convergence, statuses, issueLinks, links, events };
}
