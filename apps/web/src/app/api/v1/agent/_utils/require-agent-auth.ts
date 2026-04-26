import {
  type AgentScope,
  hasScope,
} from "@/server/api/check-agent-scope";
import { checkRateLimit } from "@/server/api/check-rate-limit";
import {
  type ResolvedAgentToken,
  resolveAgentToken,
} from "@/server/api/resolve-agent-token";
import { NextResponse } from "next/server";
import { agentError } from "./agent-error";

type AgentRateLimitKey = "agent:read" | "agent:write";

/**
 * Authenticates an agent request, checks scope, and applies rate limiting.
 * Returns the resolved token on success, or a `NextResponse` to short-circuit
 * the handler with the appropriate error.
 */
export async function requireAgentAuth(
  authHeader: string | null,
  scope: AgentScope,
  rateLimitKey: AgentRateLimitKey,
): Promise<ResolvedAgentToken | NextResponse> {
  const agentToken = await resolveAgentToken(authHeader);
  if (!agentToken) {
    return agentError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (!hasScope(agentToken.scopes, scope)) {
    return agentError("Insufficient permissions", "FORBIDDEN", 403);
  }

  const allowed = await checkRateLimit(agentToken.tokenHash, rateLimitKey);
  if (!allowed) {
    return agentError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

  return agentToken;
}

export function isAuthFailure(
  result: ResolvedAgentToken | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
