/**
 * The agent API's HTTP boundary (ADR 0012, migration step 4): agent auth,
 * parsing, transport codes and the `DomainError` mapping live here, so the
 * `_services/` function below stays transport-agnostic.
 */

import { formatFeedbackAsMarkdown } from "@/app/_domains/feedback/_helpers/format-feedback-markdown";
import { domainErrorResponse } from "@/server/errors/http-response";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { agentError } from "../../_helpers/agent-error";
import { isAuthFailure } from "../../_helpers/is-auth-failure";
import {
  FeedbackIdSchema,
  GetFeedbackQuerySchema,
} from "../../_services/agent.schema";
import { requireAgentAuth } from "../../_services/require-agent-auth";
import { getFeedback } from "./_services/get-feedback";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "feedbacks:read",
    "agent:read",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  const { id } = await context.params;
  const idParsed = FeedbackIdSchema.safeParse(id);
  if (!idParsed.success) {
    return agentError("Invalid feedback ID", "VALIDATION_ERROR", 422);
  }

  const parsed = GetFeedbackQuerySchema.safeParse({
    format: req.nextUrl.searchParams.get("format") ?? undefined,
  });
  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  try {
    const { item, videoTitle } = await getFeedback({
      feedbackId: idParsed.data,
      organizationProjects: agentToken.organization.projects,
    });

    console.info(
      `[agent-api] feedbacks:get tokenId=${agentToken.id} feedbackId=${item.id}`,
    );

    if (parsed.data.format === "markdown") {
      return new NextResponse(
        formatFeedbackAsMarkdown({ ...item, videoTitle }),
        {
          status: 200,
          headers: { "Content-Type": "text/markdown; charset=utf-8" },
        },
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    const response = domainErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
