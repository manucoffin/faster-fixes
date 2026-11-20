import type { FeedbackStatus } from "@/app/_domains/feedback";

// Linear workflow state types are user-customizable in name but the type taxonomy
// (triage|backlog|unstarted|started|completed|canceled) is fixed by Linear's API.
// Always map by type, never by name.
export type LinearStateType =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

export type LinearTeamState = { id: string; type: LinearStateType };

export type ResolvedLinearState = {
  stateId: string;
  stateType: LinearStateType;
  /** The preferred state is missing from the team, so the Project link is stale. */
  fellBack: boolean;
};

export function feedbackStatusFromLinearStateType(
  type: string,
): FeedbackStatus {
  switch (type) {
    case "completed":
      return "resolved";
    case "canceled":
      return "closed";
    case "started":
      return "in_progress";
    default:
      return "new";
  }
}

// Each state type mirrors exactly one Status (ADR-0025).
export function isLinearStateTypeMirroring(
  type: string,
  status: FeedbackStatus,
): boolean {
  return feedbackStatusFromLinearStateType(type) === status;
}

function linearStateTypeForFeedbackStatus(
  status: FeedbackStatus,
): LinearStateType {
  switch (status) {
    case "resolved":
      return "completed";
    case "closed":
      return "canceled";
    case "in_progress":
      return "started";
    case "new":
      return "unstarted";
  }
}

/** The team state to write for a Status, or null when the team has no state. */
export function resolveLinearStateToWrite({
  states,
  defaultStateId,
  status,
}: {
  states: LinearTeamState[];
  defaultStateId: string;
  status: FeedbackStatus;
}): ResolvedLinearState | null {
  const [firstState] = states;
  if (!firstState) return null;

  const pick = (state: LinearTeamState, fellBack: boolean) => ({
    stateId: state.id,
    stateType: state.type,
    fellBack,
  });

  // For "new", prefer the link's defaultStateId (user-picked); otherwise pick by type.
  if (status === "new") {
    const explicit = states.find((s) => s.id === defaultStateId);
    if (explicit) return pick(explicit, false);
    const fallback = states.find(
      (s) =>
        s.type === "unstarted" || s.type === "backlog" || s.type === "triage",
    );
    return pick(fallback ?? firstState, true);
  }

  const preferredType = linearStateTypeForFeedbackStatus(status);
  const match = states.find((s) => s.type === preferredType);
  if (match) return pick(match, false);

  // A team without a canceled state closes Archived Feedback as completed.
  if (preferredType === "canceled") {
    const alt = states.find((s) => s.type === "completed");
    if (alt) return pick(alt, true);
  }
  return pick(firstState, true);
}
