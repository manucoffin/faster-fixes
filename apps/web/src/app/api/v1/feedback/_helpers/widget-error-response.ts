import { DomainError } from "@/server/errors/domain-errors";
import { domainErrorResponse } from "@/server/errors/http-response";
import { NextResponse } from "next/server";

/**
 * The widget API's half of the domain error mapping (ADR 0012). The status
 * comes from the shared `domainErrorResponse`, the body does not: the published
 * widget contract is `{ error }` alone, and widgets already installed on
 * customer sites cannot be updated, so adding the helper's `code` field would
 * be a contract change. Anything that is not a `DomainError` yields `null` so
 * the route keeps its own 500 path.
 */
export function widgetErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof DomainError)) return null;

  const mapped = domainErrorResponse(error);
  if (!mapped) return null;

  return NextResponse.json({ error: error.message }, { status: mapped.status });
}
