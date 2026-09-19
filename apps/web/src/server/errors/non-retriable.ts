/**
 * The job boundary's half of the domain error mapping (ADR 0012): a
 * `DomainError` reaching an Inngest function body is a fact about the data
 * (an Installation that is disconnected, a link the user must repair), so the
 * same attempt three more times cannot change it. It becomes a
 * `NonRetriableError` carrying the original as `cause`, so the run history
 * keeps the reason. Anything else is infrastructure and keeps its retries.
 */

import { NonRetriableError } from "inngest";
import { DomainError } from "./domain-errors";

export function rethrowDomainErrorsAsNonRetriable(error: unknown): never {
  if (error instanceof DomainError) {
    throw new NonRetriableError(error.message, { cause: error });
  }

  throw error;
}
