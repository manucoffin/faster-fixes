import type { FeedbackStatus } from "@/app/_domains/feedback";
import type {
  IssueLinkUpdate,
  IssueStateByTracker,
  MirroredIssueLink,
  MirroringTracker,
  StatusConvergence,
} from "./update-status";

/** What a Tracker answers when asked to mirror a Status. */
export type TrackerWrite<T extends MirroringTracker = MirroringTracker> =
  /** It wrote the Issue, now in this state. */
  | { state: IssueStateByTracker[T] }
  /** The Issue state already mirrors the Status. */
  | "nothing_to_write"
  /** No path exists, as a Jira workflow with no transition to Done. */
  | "cannot_write"
  /** The Tracker confirmed the Issue is gone. */
  | "missing";

/** The per-Tracker half of the outbound decision: its write. */
export type TrackerWriter<T extends MirroringTracker = MirroringTracker> = {
  tracker: T;
  writeStatus(
    link: MirroredIssueLink<T>,
    status: FeedbackStatus,
  ): Promise<TrackerWrite<T>>;
};

type ConvergeTrackerInput = {
  feedbackId: string;
  /** The Tracker that drove the change, which already shows it. */
  origin?: MirroringTracker;
};

/**
 * Converge a Tracker (ADR-0025): pushes the Feedback's current Status to its
 * Issue on one Tracker and records the convergence.
 */
export async function convergeTracker<T extends MirroringTracker>(
  { feedbackId, origin }: ConvergeTrackerInput,
  writer: TrackerWriter<T>,
  { store }: StatusConvergence,
) {
  if (origin === writer.tracker) return { skipped: "origin_tracker" } as const;

  // The store answers a link of the writer's Tracker. The casts below are
  // there because TypeScript cannot correlate a Tracker with its state via `T`.
  const link = (await store.findFeedbackIssueLink({
    tracker: writer.tracker,
    feedbackId,
  })) as MirroredIssueLink<T> | null;
  if (!link) return { skipped: "no_issue_link" } as const;

  // The Status read now, not the event's: two quick changes end with the
  // Tracker showing the last one whatever order their events run in.
  const status = link.feedbackStatus;
  const written = await writer.writeStatus(link, status);

  if (written === "missing") {
    await store.detachIssueLink(link);
    return { feedbackId, detached: true } as const;
  }

  // The link stays pending, so the Tracker cannot change the Feedback until a
  // later convergence succeeds.
  if (written === "cannot_write") {
    console.warn(
      `[${link.tracker}] cannot write ${status} to the Issue of Feedback ${feedbackId}`,
    );
    return { skipped: "cannot_write" } as const;
  }

  const state =
    written === "nothing_to_write" ? link.issueState : written.state;
  await store.recordConvergence({
    tracker: link.tracker,
    id: link.id,
    data: { ...state, mirroredStatus: status },
  } as IssueLinkUpdate);

  return written === "nothing_to_write"
    ? ({ feedbackId, skipped: "nothing_to_write" } as const)
    : ({ feedbackId, mirroredStatus: status } as const);
}
