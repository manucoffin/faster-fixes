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

export type StatusConvergenceStore = {
  /**
   * Writes `status` to each Feedback whose Status is in `from` (any Status
   * when omitted), in one guarded write, and returns the ids it wrote.
   */
  writeStatuses(input: {
    feedbackIds: string[];
    status: FeedbackStatus;
    from?: FeedbackStatus[];
  }): Promise<string[]>;
};

export type StatusConvergence = {
  store: StatusConvergenceStore;
  sendEvents: (events: StatusChangedEventData[]) => void;
};

type UpdateStatusInput = {
  feedbackIds: string[];
  status: FeedbackStatus;
  /** Writes only Feedbacks still in this Status, as Restore does from Archived. */
  onlyFrom?: FeedbackStatus;
  actor: StatusActor;
};

/** Change a Status: writes it, emits one event per Feedback written, and returns their ids. */
export async function updateStatus(
  { feedbackIds, status, onlyFrom, actor }: UpdateStatusInput,
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

  const written = await store.writeStatuses({ feedbackIds, status, from });

  if (written.length > 0) {
    sendEvents(
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
