/**
 * The agent API's HTTP boundary (ADR 0012, migration step 4): agent auth,
 * parsing, transport codes and the `DomainError` mapping live here, so the
 * `_services/` function below stays transport-agnostic.
 */

import { domainErrorResponse } from "@/server/errors/http-response";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../../_helpers/agent-error";
import {
  FeedbackIdSchema,
  UpdateFeedbackStatusSchema,
} from "../../../_services/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../../_services/require-agent-auth";
import { updateFeedbackStatus } from "./_services/update-feedback-status";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
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

  try {
    const updated = await updateFeedbackStatus({
      feedbackId: idParsed.data,
      status: parsed.data.status,
      organizationProjects: agentToken.organization.projects,
    });

    console.info(
      `[agent-api] feedbacks:update_status tokenId=${agentToken.id} feedbackId=${updated.id} ${updated.previousStatus} -> ${updated.status}`,
    );

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    const response = domainErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
