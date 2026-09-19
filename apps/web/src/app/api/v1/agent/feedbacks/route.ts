/**
 * The agent API's HTTP boundary (ADR 0012, migration step 4): agent auth,
 * parsing, transport codes and the `DomainError` mapping live here, so the
 * `_services/` functions below stay transport-agnostic. `POST` is converted in
 * its own ticket and still re-exports its handler.
 */

import { formatFeedbackListAsMarkdown } from "@/app/_domains/feedback/_helpers/format-feedback-markdown";
import { domainErrorResponse } from "@/server/errors/http-response";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../_helpers/agent-error";
import { ListFeedbacksQuerySchema } from "../_services/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../_services/require-agent-auth";
import { listFeedbacks } from "./_services/list-feedbacks";

export { createFeedbacks as POST } from "./_services/create-feedbacks";

export async function GET(req: NextRequest) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "feedbacks:read",
    "agent:read",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  const { searchParams } = req.nextUrl;
  const parsed = ListFeedbacksQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    page_url: searchParams.get("page_url") ?? undefined,
    project: searchParams.get("project") ?? undefined,
    format: searchParams.get("format") ?? undefined,
  });

  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  const { status, page_url, project, format } = parsed.data;

  try {
    const { projectId, items } = await listFeedbacks({
      project,
      organizationProjects: agentToken.organization.projects,
      status,
      pageUrl: page_url,
    });

    console.info(
      `[agent-api] feedbacks:list tokenId=${agentToken.id} project=${projectId} count=${items.length}`,
    );

    if (format === "markdown") {
      return new NextResponse(formatFeedbackListAsMarkdown(items), {
        status: 200,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }

    return NextResponse.json({ feedbacks: items, count: items.length });
  } catch (error) {
    const response = domainErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
