import { formatFeedbackListAsMarkdown } from "@/app/_features/feedback/format-feedback-markdown";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../_utils/agent-error";
import { ListFeedbacksQuerySchema } from "../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../_utils/require-agent-auth";
import { resolveProjectId } from "../../_utils/resolve-project-id";

export async function listFeedbacks(req: NextRequest) {
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

  const projectId = resolveProjectId(project, agentToken.organization.projects);
  if (!projectId) {
    return agentError("Project not found", "NOT_FOUND", 404);
  }

  const feedbacks = await prisma.feedback.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
      ...(page_url ? { pageUrl: page_url } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  console.info(
    `[agent-api] feedbacks:list tokenId=${agentToken.id} project=${projectId} count=${feedbacks.length}`,
  );

  const mapped = await Promise.all(
    feedbacks.map(async (f) => ({
      id: f.id,
      status: f.status,
      comment: f.comment,
      pageUrl: f.pageUrl,
      selector: f.selector,
      clickX: f.clickX,
      clickY: f.clickY,
      viewportWidth: f.viewportWidth,
      viewportHeight: f.viewportHeight,
      browserName: f.browserName,
      browserVersion: f.browserVersion,
      os: f.os,
      screenshotUrl: f.screenshot
        ? await getSignedAssetUrl(f.screenshot)
        : null,
      metadata: f.metadata as Record<string, unknown> | null,
      reviewerName: f.reviewer.name,
      createdAt: f.createdAt,
    })),
  );

  if (format === "markdown") {
    return new NextResponse(formatFeedbackListAsMarkdown(mapped), {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return NextResponse.json({
    feedbacks: mapped,
    count: mapped.length,
  });
}
