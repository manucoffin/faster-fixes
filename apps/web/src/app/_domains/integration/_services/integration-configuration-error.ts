/**
 * A provider Integration cannot run because the deployment is misconfigured: a
 * missing client secret, a signing secret that was never set, a base URL that
 * cannot be derived. Infrastructure, not a business failure, so it stays a
 * plain `Error` subclass rather than a `DomainError` (ADR 0012): it keeps
 * surfacing as a masked 500 at a transport and keeps its retries in a durable
 * function, while `services-no-bare-error` still gets a named class to see.
 *
 * It sits at the bucket root because every provider needs the same one.
 */
export class IntegrationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationConfigurationError";
  }
}
