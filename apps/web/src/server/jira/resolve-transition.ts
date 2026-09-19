// Translates between Feedback statuses and Jira workflow positions, in both
// directions. Jira status *names* are
// per-project and arbitrary, so the mapping keys on the status category — the one
// primitive every workflow shares (ADR 0008 / PRD #7).

import type { FeedbackStatus } from "@/app/_domains/feedback";
import type { JiraTransition } from "./jira-rest-client";

const CATEGORY_TODO = "new";
const CATEGORY_IN_PROGRESS = "indeterminate";
export const CATEGORY_DONE = "done";

// Workflows often expose several Done-category transitions (Done, Won't Do,
// Duplicate, Cannot Reproduce...). Prefer the ones that read as a plain finish
// before falling back to whatever the workflow happens to offer first.
const PREFERRED_DONE_STATUS_NAMES = ["done", "closed", "won't do"];

const RESOLVED_RESOLUTION_NAMES = ["Done", "Fixed", "Resolved"];
const ARCHIVED_RESOLUTION_NAMES = [
  "Won't Do",
  "Won't Fix",
  "Declined",
  "Cancelled",
];

export type ResolvedJiraTransition = {
  transitionId: string;
  toStatusCategory: string;
  resolutionName?: string;
};

// Jira rejects a resolution value the transition screen doesn't offer, so an
// unavailable preference is dropped rather than guessed at.
function pickResolutionName(
  transition: JiraTransition,
  feedbackStatus: FeedbackStatus,
): string | undefined {
  if (!transition.acceptsResolution) return undefined;

  const preferred =
    feedbackStatus === "closed"
      ? ARCHIVED_RESOLUTION_NAMES
      : RESOLVED_RESOLUTION_NAMES;

  // No allowedValues reported means Jira didn't constrain the field; the site's
  // default resolution names are the best available guess.
  if (transition.resolutionOptions.length === 0) return preferred[0];

  return preferred.find((name) =>
    transition.resolutionOptions.some(
      (option) => option.toLowerCase() === name.toLowerCase(),
    ),
  );
}

/**
 * Returns the transition to apply, or null when the workflow offers no path to
 * the target category from the issue's current status (locked-down workflows,
 * transitions gated on a role we don't have). Callers skip in that case: the Jira
 * issue is a best-effort mirror, not a second source of truth.
 */
export function resolveJiraTransition(args: {
  transitions: JiraTransition[];
  feedbackStatus: FeedbackStatus;
}): ResolvedJiraTransition | null {
  const { transitions, feedbackStatus } = args;
  const wantsDone =
    feedbackStatus === "resolved" || feedbackStatus === "closed";

  if (!wantsDone) {
    // Reopening: In Progress mirrors "someone is on it"; To Do covers workflows
    // whose only way out of Done is back to the backlog.
    const target =
      transitions.find((t) => t.toStatusCategory === CATEGORY_IN_PROGRESS) ??
      transitions.find((t) => t.toStatusCategory === CATEGORY_TODO);

    return target
      ? { transitionId: target.id, toStatusCategory: target.toStatusCategory }
      : null;
  }

  const doneTransitions = transitions.filter(
    (t) => t.toStatusCategory === CATEGORY_DONE,
  );
  if (doneTransitions.length === 0) return null;

  const chosen =
    PREFERRED_DONE_STATUS_NAMES.map((name) =>
      doneTransitions.find((t) => t.toStatusName.toLowerCase() === name),
    ).find(Boolean) ?? doneTransitions[0]!;

  return {
    transitionId: chosen.id,
    toStatusCategory: chosen.toStatusCategory,
    resolutionName: pickResolutionName(chosen, feedbackStatus),
  };
}

/**
 * The reverse mapping, for changes observed in Jira.
 *
 * To Do maps to `in_progress` rather than `new`, matching the GitHub/Linear reopen
 * convention: `new` means "nobody has looked at this yet", which stops being true
 * the moment someone moves the issue in Jira. Inbound sync therefore never
 * resurrects a Feedback into the untriaged inbox.
 */
export function feedbackStatusFromJiraStatusCategory(
  statusCategory: string,
): FeedbackStatus {
  return statusCategory === CATEGORY_DONE ? "resolved" : "in_progress";
}
