import { hasScope } from "@/server/api/check-agent-scope";
import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveAgentToken } from "@/server/api/resolve-agent-token";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import {
  FeedbackIdSchema,
  UpdateFeedbackStatusSchema,
} from "../../../agent.schema";

function agentError(
  message: string,
  code: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/v1/agent/feedbacks/:id/status — update feedback status
export async function POST(req: NextRequest, context: RouteContext) {
  const agentToken = await resolveAgentToken(req.headers.get("authorization"));
  if (!agentToken) {
    return agentError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (!hasScope(agentToken.scopes, "feedbacks:update_status")) {
    return agentError("Insufficient permissions", "FORBIDDEN", 403);
  }

  const allowed = await checkRateLimit(agentToken.tokenHash, "agent:write");
  if (!allowed) {
    return agentError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

  const { id } = await context.params;
  const idParsed = FeedbackIdSchema.safeParse(id);
  if (!idParsed.success) {
    return agentError("Invalid feedback ID", "VALIDATION_ERROR", 422);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return agentError("Invalid JSON body", "VALIDATION_ERROR", 422);
  }

  const parsed = UpdateFeedbackStatusSchema.safeParse(body);
  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  // Verify feedback belongs to a project in the token's organization
  const orgProjectIds = agentToken.organization.projects.map((p) => p.id);
  const feedback = await prisma.feedback.findFirst({
    where: { id: idParsed.data, projectId: { in: orgProjectIds } },
    select: { id: true, status: true },
  });

  if (!feedback) {
    return agentError("Feedback not found", "NOT_FOUND", 404);
  }

  const previousStatus = feedback.status;
  const updated = await prisma.feedback.update({
    where: { id: feedback.id },
    data: { status: parsed.data.status },
    select: { id: true, status: true, updatedAt: true },
  });

  console.info(
    `[agent-api] feedbacks:update_status tokenId=${agentToken.id} feedbackId=${feedback.id} ${previousStatus} -> ${parsed.data.status}`,
  );

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt,
  });
}
