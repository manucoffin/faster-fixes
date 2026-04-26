import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../../../_utils/agent-error";
import {
  FeedbackIdSchema,
  UpdateFeedbackStatusSchema,
} from "../../../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../../../_utils/require-agent-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function updateFeedbackStatus(
  req: NextRequest,
  context: RouteContext,
) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "feedbacks:update_status",
    "agent:write",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

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

  // Verify the feedback belongs to a project in the token's organization.
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

  // Fire-and-forget: sync status to GitHub if linked.
  inngest
    .send({
      name: "feedback/status-changed",
      data: { feedbackId: feedback.id, newStatus: parsed.data.status },
    })
    .catch(() => {});

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    updatedAt: updated.updatedAt,
  });
}
