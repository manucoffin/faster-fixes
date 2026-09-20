/**
 * The agent API's HTTP boundary (ADR 0012, migration step 4): agent auth,
 * parsing, transport codes and the `DomainError` mapping live here, so the
 * `_services/` functions below stay transport-agnostic.
 */

import { formatFeedbackListAsMarkdown } from "@/app/_domains/feedback/_helpers/format-feedback-markdown";
import { domainErrorResponse } from "@/server/errors/http-response";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../_helpers/agent-error";
import {
  CreateFeedbacksSchema,
  ListFeedbacksQuerySchema,
} from "../_services/agent.schema";
import { isAuthFailure } from "../_helpers/is-auth-failure";
import { requireAgentAuth } from "../_services/require-agent-auth";
import { createFeedbacks } from "./_services/create-feedbacks";
import { listFeedbacks } from "./_services/list-feedbacks";

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

export async function POST(req: NextRequest) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "feedbacks:create",
    "agent:write",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return agentError("Invalid JSON body", "VALIDATION_ERROR", 422);
  }

  const parsed = CreateFeedbacksSchema.safeParse(body);
  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  const { project, reviewer_name, source, feedbacks } = parsed.data;

  try {
    const result = await createFeedbacks({
      project,
      organizationId: agentToken.organization.id,
      organizationProjects: agentToken.organization.projects,
      reviewerName: reviewer_name,
      source,
      feedbacks,
    });

    // A plan limit is a transport concern here, not a domain error: the body
    // carries the counters the caller needs to split the batch or upgrade.
    if (result.limitExceeded) {
      return agentError(
        "Feedback limit would be exceeded by this batch.",
        "RESOURCE_LIMIT_EXCEEDED",
        403,
        {
          extra: {
            current: result.current,
            limit: result.limit,
            requested: result.requested,
          },
        },
      );
    }

    console.info(
      `[agent-api] feedbacks:create tokenId=${agentToken.id} project=${result.projectId} count=${result.feedbacks.length} source=${source ?? "n/a"} reviewer=${result.reviewer.id}`,
    );

    return NextResponse.json(
      {
        created: result.feedbacks.length,
        feedbacks: result.feedbacks,
        reviewer: result.reviewer,
        atLimit: result.atLimit,
      },
      { status: 201 },
    );
  } catch (error) {
    const response = domainErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
