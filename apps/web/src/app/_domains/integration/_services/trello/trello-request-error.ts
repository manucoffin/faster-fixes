/**
 * Trello or its authorization server answered with something we cannot use.
 * Infrastructure, like `JiraRequestError`: a plain `Error` subclass, never a
 * `DomainError`, so a durable function keeps retrying it and a transport keeps
 * masking it (ADR 0012). The status travels with the error so token access can
 * tell an explicit refusal from an outage.
 */
export class TrelloRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    path: string,
  ) {
    super(`Trello request failed (${status}) for ${path}: ${body}`);
    this.name = "TrelloRequestError";
  }
}
