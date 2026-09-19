import { AGENT_API_RATE_LIMITS } from "@/app/_domains/subscription";
import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveOrganizationPlan } from "@/server/auth/subscription";
import { isCloud } from "@/utils/environment/env";
import { prisma } from "@workspace/db";
import { NextResponse } from "next/server";
import { agentError } from "../_helpers/agent-error";
import { type AgentScope, hasAgentScope } from "../_helpers/has-agent-scope";
import {
  type AuthenticatedAgentToken,
  findAgentToken,
} from "./find-agent-token";

type AgentRateLimitKey = "agent:read" | "agent:write";

/**
 * Authenticates an agent request, checks scope, and applies rate limiting.
 * Returns the resolved token on success, or a `NextResponse` to short-circuit
 * the handler with the appropriate error.
 *
 * The one agent API service allowed to return a response: its 401, 403 and 429
 * carry headers and extra body fields a `DomainError` cannot express.
 *
 * The rate limit is an abuse backstop, not authorization (see docs/adr/0007):
 * keyed per organization (not per token — minting tokens must not multiply the
 * budget), tiered by plan, and skipped entirely off cloud (self-hosted runs on
 * the operator's own infra).
 */
export async function requireAgentAuth(
  authHeader: string | null,
  scope: AgentScope,
  rateLimitKey: AgentRateLimitKey,
): Promise<AuthenticatedAgentToken | NextResponse> {
  const agentToken = await findAgentToken(authHeader);
  if (!agentToken) {
    return agentError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (!hasAgentScope(agentToken.scopes, scope)) {
    return agentError("Insufficient permissions", "FORBIDDEN", 403);
  }

  if (isCloud()) {
    const plan = await resolveOrganizationPlan(
      agentToken.organization.id,
      prisma,
    );
    const kind = rateLimitKey === "agent:write" ? "write" : "read";
    const max = AGENT_API_RATE_LIMITS[plan.planName][kind];

    const result = await checkRateLimit(
      agentToken.organization.id,
      rateLimitKey,
      max,
    );

    if (!result.allowed) {
      const resetIso = new Date(result.resetAt).toISOString();
      return agentError(
        `Rate limit exceeded. 0 of ${result.limit} ${kind} operations remaining this hour. Retry after ${result.retryAfterSeconds} seconds (window resets at ${resetIso}).`,
        "RATE_LIMITED",
        429,
        {
          headers: {
            "Retry-After": String(result.retryAfterSeconds),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
          },
          extra: {
            limit: result.limit,
            remaining: result.remaining,
            retryAfterSeconds: result.retryAfterSeconds,
            resetAt: resetIso,
          },
        },
      );
    }
  }

  return agentToken;
}

export function isAuthFailure(
  result: AuthenticatedAgentToken | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
