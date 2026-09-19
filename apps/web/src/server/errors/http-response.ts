/**
 * The HTTP boundary's half of the domain error mapping (ADR 0012): a
 * `DomainError` becomes the `{ error, code }` JSON body route handlers already
 * answer with, at the status its code maps to 1:1. Anything else yields `null`
 * so the caller keeps its own 500 path rather than dressing a bug as a 4xx.
 */

import { DomainError, type DomainErrorCode } from "./domain-errors";

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
};

export function domainErrorResponse(error: unknown): Response | null {
  if (!(error instanceof DomainError)) return null;

  return Response.json(
    { error: error.message, code: error.code },
    { status: STATUS_BY_CODE[error.code] },
  );
}
