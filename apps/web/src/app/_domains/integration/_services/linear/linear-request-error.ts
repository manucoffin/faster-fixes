/**
 * Linear answered a request with something we cannot use. Infrastructure, like
 * the existing `JiraRequestError`: a plain `Error` subclass, never a
 * `DomainError`, so a durable function keeps retrying it and a transport keeps
 * masking it (ADR 0012).
 */
export class LinearRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinearRequestError";
  }
}
