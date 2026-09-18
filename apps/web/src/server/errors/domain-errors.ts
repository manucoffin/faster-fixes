/**
 * The closed vocabulary for expected business failures. Zero imports on
 * purpose: a service throwing one of these must stay transport-agnostic, and
 * every boundary (tRPC today, route handlers, RSC and jobs in step 4) maps the
 * code exactly once. See `docs/adr/` for the domain errors ADR.
 *
 * `UNAUTHORIZED` is absent: identity is established at the transport edge
 * before a service runs. `ForbiddenError` covers permission facts.
 */
export type DomainErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "PRECONDITION_FAILED";

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND" as const;
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT" as const;
}

export class BadRequestError extends DomainError {
  readonly code = "BAD_REQUEST" as const;
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN" as const;
}

export class PreconditionFailedError extends DomainError {
  readonly code = "PRECONDITION_FAILED" as const;
}
