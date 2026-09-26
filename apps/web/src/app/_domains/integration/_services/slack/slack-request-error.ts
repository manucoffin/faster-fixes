/**
 * Slack answered a request with something we cannot use. Infrastructure, like
 * `LinearRequestError` and `JiraRequestError`: a plain `Error` subclass, never a
 * `DomainError`, so a durable function keeps retrying it and a transport keeps
 * masking it (ADR 0012).
 *
 * The message is load-bearing beyond the log: `matchUnhealthySlackError` reads
 * it to tell a permanently broken channel or token from a transient failure, so
 * a site that carries a Slack error code must keep that code in the message.
 */
export class SlackRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackRequestError";
  }
}
