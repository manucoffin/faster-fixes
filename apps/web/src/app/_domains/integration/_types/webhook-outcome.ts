/**
 * What a Tracker webhook orchestration service tells its route. It sits at the
 * bucket root because every Tracker returns the same three outcomes: GitHub,
 * Linear and Jira differ in what they authenticate, not in what they decide
 * once the delivery is authentic.
 *
 * The route owns the HTTP mapping: authentication failures (401), an unreadable
 * body (400) and a missing signing secret (500, Linear only) never reach the
 * service, and an `ignored` reason is not part of any current response body.
 */
export type TrackerWebhookOutcome =
  /** The delivery was processed: a write happened or a job was queued. */
  | { status: "accepted" }
  /**
   * Authentic but not for us: an event type or an action we do not handle, or
   * no Installation behind it. Deliberately not an error, so the Tracker does
   * not retry a delivery we will never want.
   */
  | { status: "ignored"; reason: string }
  /** Already processed. The reason is echoed in the response body. */
  | { status: "skipped"; reason: "duplicate delivery" };
