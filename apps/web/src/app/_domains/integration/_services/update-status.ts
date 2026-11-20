import {
  FeedbackStatusEnum,
  type FeedbackStatus,
} from "@/app/_domains/feedback";

// Status convergence (ADR-0025): every change of a Feedback's Status goes
// through this module, so no writer hand-writes the event, its `origin` or its
// Status actor. Plain functions: the store and the event sender are injected.

type Tracker = "github" | "linear" | "jira" | "trello";

/** Who drove the change: a User in the inbox, the Agent, or a Tracker sync. */
export type StatusActor = "user" | "agent" | Tracker;

/** The data of one `feedback/status-changed` event. */
export type StatusChangedEventData = {
  feedbackId: string;
  newStatus: FeedbackStatus;
  origin?: Tracker;
  actor: "user" | "agent" | "tracker";
};

/** The Issue state an Issue link records at its last convergence, per Tracker. */
export type IssueStateByTracker = {
  github: { issueState: "open" | "closed" };
  linear: { issueStateId: string; issueStateType: string };
  jira: { issueStatusCategory: string };
  trello: { listId: string; archived: boolean };
};

// The Trackers whose Issue links record a Mirrored Status and go through the
// inbound decision. The others join as they move to ADR-0025.
export type MirroringTracker = "jira" | "github" | "linear";

/** The Issue state a Tracker sync records on its Issue link, per Tracker. */
export type IssueLinkUpdate = {
  [T in Tracker]: {
    tracker: T;
    id: string;
    data: IssueStateByTracker[T] &
      (T extends MirroringTracker
        ? { mirroredStatus: FeedbackStatus }
        : object);
  };
}[Tracker];

/** What a delivery names: the Issue, scoped to what identified the delivery. */
export type IssueReference<T extends MirroringTracker = MirroringTracker> = {
  jira: { tracker: "jira"; issueId: string; installationId: string };
  // A signed GitHub delivery names its repository; issue numbers are unique in it.
  github: { tracker: "github"; repoFullName: string; issueNumber: number };
  linear: { tracker: "linear"; issueId: string; installationId: string };
}[T];

/** An Issue link as the inbound decision reads it, with its Feedback's Status. */
export type MirroredIssueLink<T extends MirroringTracker = MirroringTracker> = {
  tracker: T;
  id: string;
  feedbackId: string;
  feedbackStatus: FeedbackStatus;
  /** Null, or a Status other than `feedbackStatus`, means pending. */
  mirroredStatus: FeedbackStatus | null;
  issueState: IssueStateByTracker[T];
};

/** The Issue state a link that is not pending records, per Tracker. */
export type IssueStateRefresh = {
  [T in MirroringTracker]: {
    tracker: T;
    id: string;
    issueState: IssueStateByTracker[T];
  };
}[MirroringTracker];

export type StatusConvergenceStore = {
  /**
   * Writes `status` to each Feedback whose Status is in `from` (any Status
   * when omitted), in one guarded write, and returns the ids it wrote. An
   * `issueLink` is updated in the same transaction, whether or not the
   * Feedback was written.
   */
  writeStatuses(input: {
    feedbackIds: string[];
    status: FeedbackStatus;
    from?: FeedbackStatus[];
    issueLink?: IssueLinkUpdate;
  }): Promise<string[]>;
  /** Answers a link of the reference's Tracker. */
  findIssueLink(reference: IssueReference): Promise<MirroredIssueLink | null>;
  /** Records the Issue state of a link that is not pending, leaving its Mirrored Status. */
  refreshIssueState(refresh: IssueStateRefresh): Promise<void>;
  /** Deletes the Issue link and leaves its Feedback alone. */
  detachIssueLink(link: MirroredIssueLink): Promise<void>;
};

export type StatusConvergence = {
  store: StatusConvergenceStore;
  sendEvents: (events: StatusChangedEventData[]) => void | Promise<void>;
};

type UpdateStatusInput = {
  feedbackIds: string[];
  status: FeedbackStatus;
  /** Writes only Feedbacks still in this Status, as Restore does from Archived. */
  onlyFrom?: FeedbackStatus;
  actor: StatusActor;
  /** The Issue link of the Tracker that drove the change, recorded atomically with it. */
  issueLink?: IssueLinkUpdate;
};

/** Change a Status: writes it, emits one event per Feedback written, and returns their ids. */
export async function updateStatus(
  { feedbackIds, status, onlyFrom, actor, issueLink }: UpdateStatusInput,
  { store, sendEvents }: StatusConvergence,
) {
  if (feedbackIds.length === 0) return [];

  // ADR-0007: a User re-setting the same Status still converges the Trackers,
  // the Agent and a Tracker only write a real change.
  const from =
    actor === "user"
      ? onlyFrom && [onlyFrom]
      : FeedbackStatusEnum.options.filter(
          (candidate) =>
            candidate !== status && (!onlyFrom || candidate === onlyFrom),
        );

  const written = await store.writeStatuses({
    feedbackIds,
    status,
    from,
    issueLink,
  });

  if (written.length > 0) {
    await sendEvents(
      written.map((feedbackId) => ({
        feedbackId,
        newStatus: status,
        ...toEventActor(actor),
      })),
    );
  }

  return written;
}

function toEventActor(
  actor: StatusActor,
): Pick<StatusChangedEventData, "origin" | "actor"> {
  if (actor === "user" || actor === "agent") return { actor };
  return { origin: actor, actor: "tracker" };
}
