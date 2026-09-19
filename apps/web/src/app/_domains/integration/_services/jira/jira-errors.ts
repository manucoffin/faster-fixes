import { PreconditionFailedError } from "@/server/errors/domain-errors";

/**
 * The expected Jira failures, as second-level subclasses of the vocabulary of
 * ADR 0012. A caller has to tell them apart (the webhook refresh skips on two
 * of them, issue creation stores the reason of the third), so they keep their
 * names and their fields, while the code they carry stays one of the five.
 * Every message below is final user copy: tRPC surfaces it verbatim on the
 * Jira screens instead of a 500.
 *
 * They sit in their own module so a boundary or a test can name them without
 * pulling the database client and the token cipher in. `JiraRequestError` is
 * infrastructure and stays a plain `Error`.
 */

export class JiraNotConnectedError extends PreconditionFailedError {
  constructor() {
    // Same sentence as the pre-check in `get-jira-access`, so the screens read
    // identically whichever of the two fires.
    super("Jira is not connected. Connect a Jira site first.");
    this.name = "JiraNotConnectedError";
  }
}

// Thrown when Atlassian refuses the grant itself (revoked user access). The
// installation is flipped to `reconnect_required` so the UI can prompt a
// re-authorization instead of failing silently (ADR 0008). An outage is never
// this error: see `isRefusedByAtlassian`.
export class JiraReauthRequiredError extends PreconditionFailedError {
  constructor(readonly installationId: string) {
    super("The Jira connection needs to be re-authorized.");
    this.name = "JiraReauthRequiredError";
  }
}

export type JiraIssueConfigurationReason = "stale_issue_type" | "stale_project";

const ISSUE_CONFIGURATION_COPY: Record<JiraIssueConfigurationReason, string> = {
  stale_project:
    "The linked Jira project is no longer available. Update the Jira link in the Project settings.",
  stale_issue_type:
    "The linked Jira issue type no longer accepts this issue. Update the Jira link in the Project settings.",
};

/**
 * Jira rejected the create payload itself — a required field appeared after the
 * link was made, or the issue type / project no longer accepts it. Retrying the
 * same payload can never succeed, so callers surface this as link ill-health
 * instead of burning the retry budget.
 */
export class JiraIssueConfigurationError extends PreconditionFailedError {
  constructor(
    // Matches the ProjectJiraLink.linkHealthIssue vocabulary so callers can
    // store it verbatim.
    readonly reason: JiraIssueConfigurationReason,
    // The raw Jira response body, kept off the message so user copy never
    // carries a provider payload.
    readonly detail: string,
  ) {
    super(ISSUE_CONFIGURATION_COPY[reason]);
    this.name = "JiraIssueConfigurationError";
  }
}
