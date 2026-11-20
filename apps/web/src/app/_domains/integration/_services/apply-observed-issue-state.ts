import type { FeedbackStatus } from "@/app/_domains/feedback";
import {
  updateStatus,
  type IssueLinkUpdate,
  type IssueStateRefresh,
  type IssueReference,
  type IssueStateByTracker,
  type MirroredIssueLink,
  type MirroringTracker,
  type StatusConvergence,
} from "./update-status";

/** What a re-read of the Issue found on the Tracker. */
export type ObservedIssue<T extends MirroringTracker = MirroringTracker> =
  | { state: IssueStateByTracker[T] }
  | "missing";

/** The per-Tracker half of the inbound decision: its mapping and its re-read. */
export type TrackerAdapter<T extends MirroringTracker = MirroringTracker> = {
  tracker: T;
  /** Reads the Issue from the Tracker: the payload only names the Issue link. */
  readIssue(link: MirroredIssueLink<T>): Promise<ObservedIssue<T>>;
  /** One state may mirror several Statuses (Jira Done mirrors Resolved and Archived). */
  isMirroring(state: IssueStateByTracker[T], status: FeedbackStatus): boolean;
  getImpliedStatus(state: IssueStateByTracker[T]): FeedbackStatus | null;
};

type ApplyObservedIssueStateInput<T extends MirroringTracker> = {
  reference: IssueReference<T>;
  /** The delivery claims the Issue is gone; only a re-read confirms it. */
  deleted?: boolean;
};

/**
 * Apply an observed Issue state (ADR-0025): re-reads the Issue, then detaches
 * its link, changes nothing, or changes the Feedback's Status with the Tracker
 * as actor.
 */
export async function applyObservedIssueState<T extends MirroringTracker>(
  { reference, deleted = false }: ApplyObservedIssueStateInput<T>,
  adapter: TrackerAdapter<T>,
  convergence: StatusConvergence,
) {
  const { store } = convergence;
  // The store answers a link of the reference's Tracker. The casts below are
  // there because TypeScript cannot correlate a Tracker with its state via `T`.
  const link = (await store.findIssueLink(
    reference,
  )) as MirroredIssueLink<T> | null;
  if (!link) return { skipped: "no_matching_issue_link" } as const;

  const observed = await adapter.readIssue(link);

  // Detaching rather than cascading to the Feedback keeps the inbox intact and
  // lets the Feedback be exported to the Tracker again.
  if (observed === "missing") {
    await store.detachIssueLink(link);
    return { feedbackId: link.feedbackId, detached: true } as const;
  }

  // The Tracker still has the Issue, so the deletion was stale or forged.
  if (deleted) return { skipped: "deletion_not_confirmed" } as const;

  // The Feedback wins until the Tracker has converged to its Status, so an
  // echo or a stale delivery cannot revert a Status the team just set.
  if (link.mirroredStatus !== link.feedbackStatus) {
    return { skipped: "issue_link_pending" } as const;
  }

  const { state } = observed;

  // Comments, assignees and field edits leave the state as it was.
  if (isSameIssueState(state, link.issueState)) {
    return { skipped: "issue_state_unchanged" } as const;
  }

  const status = adapter.isMirroring(state, link.feedbackStatus)
    ? null
    : adapter.getImpliedStatus(state);

  if (!status) {
    await store.refreshIssueState({
      tracker: link.tracker,
      id: link.id,
      issueState: state,
    } as IssueStateRefresh);
    return { skipped: "issue_state_implies_no_change" } as const;
  }

  // Guarded on the Status the decision read: a change made since then leaves
  // the link pending, and the Feedback wins again.
  await updateStatus(
    {
      feedbackIds: [link.feedbackId],
      status,
      onlyFrom: link.feedbackStatus,
      actor: link.tracker,
      issueLink: {
        tracker: link.tracker,
        id: link.id,
        data: { ...state, mirroredStatus: status },
      } as IssueLinkUpdate,
    },
    convergence,
  );

  return { feedbackId: link.feedbackId, newStatus: status } as const;
}

function isSameIssueState<S extends object>(a: S, b: S) {
  const keys = Object.keys(a) as (keyof S)[];
  return keys.every((key) => a[key] === b[key]);
}
