import { NextResponse } from "next/server";

import type { AuthenticatedAgentToken } from "../_services/find-agent-token";

/**
 * Narrows the result of `requireAgentAuth`: a `NextResponse` is the
 * short-circuit the route returns as-is, anything else is the resolved token.
 */
export function isAuthFailure(
  result: AuthenticatedAgentToken | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
