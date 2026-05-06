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

// Faster Fixes feedback statuses. The literal "closed" is rendered as "Archived" in the UI;
// see CONTEXT.md for the canonical glossary.
export type FeedbackStatus = "new" | "in_progress" | "resolved" | "closed";

export function feedbackStatusFromLinearStateType(
  type: LinearStateType,
): FeedbackStatus {
  switch (type) {
    case "completed":
      return "resolved";
    case "canceled":
      return "closed";
    case "started":
      return "in_progress";
    case "triage":
    case "backlog":
    case "unstarted":
      return "new";
  }
}

// The state TYPE we want to write when the app is the source of the change.
// The actual state ID is resolved by resolve-team-state.ts using this preferred type
// plus the project link's defaultStateId for "new".
export function linearStateTypeForFeedbackStatus(
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
