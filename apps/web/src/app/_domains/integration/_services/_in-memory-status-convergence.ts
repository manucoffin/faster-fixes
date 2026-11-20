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

  function recordIssueLink({ tracker, id, data }: IssueLinkUpdate) {
    const stored = links.get(id);
    if (!stored || stored.tracker !== tracker) return;
    const { mirroredStatus, ...issueState } = data;
    stored.mirroredStatus = mirroredStatus;
    stored.issueState = issueState;
  }

  function withFeedbackStatus(
    stored: InMemoryIssueLink | undefined,
  ): MirroredIssueLink | null {
    const feedbackStatus = stored && statuses.get(stored.feedbackId);
    if (!stored || !feedbackStatus) return null;
    const { reference: _reference, ...link } = stored;
    return { ...link, feedbackStatus };
  }

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
          recordIssueLink(issueLink);
        }
        return Promise.resolve(written);
      },
      findIssueLink(reference) {
        return Promise.resolve(
          withFeedbackStatus(
            [...links.values()].find(
              (link) =>
                JSON.stringify(link.reference) === JSON.stringify(reference),
            ),
          ),
        );
      },
      findFeedbackIssueLink({ tracker, feedbackId }) {
        return Promise.resolve(
          withFeedbackStatus(
            [...links.values()].find(
              (link) =>
                link.tracker === tracker && link.feedbackId === feedbackId,
            ),
          ),
        );
      },
      recordConvergence(update) {
        issueLinks.push(update);
        recordIssueLink(update);
        return Promise.resolve();
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
