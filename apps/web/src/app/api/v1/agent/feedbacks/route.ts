import { formatFeedbackListAsMarkdown } from "@/app/_features/feedback/format-feedback-markdown";
import { hasScope } from "@/server/api/check-agent-scope";
import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveAgentToken } from "@/server/api/resolve-agent-token";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { ListFeedbacksQuerySchema } from "../agent.schema";

function agentError(
  message: string,
  code: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

function resolveProjectId(
  publicIdOrId: string,
  orgProjects: Array<{ id: string; publicId: string }>,
): string | null {
  const match = orgProjects.find(
    (p) => p.publicId === publicIdOrId || p.id === publicIdOrId,
  );
  return match?.id ?? null;
}

// GET /api/v1/agent/feedbacks — list feedbacks for a project
export async function GET(req: NextRequest) {
  const agentToken = await resolveAgentToken(req.headers.get("authorization"));
  if (!agentToken) {
    return agentError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (!hasScope(agentToken.scopes, "feedbacks:read")) {
    return agentError("Insufficient permissions", "FORBIDDEN", 403);
  }

  const allowed = await checkRateLimit(agentToken.tokenHash, "agent:read");
  if (!allowed) {
    return agentError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

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
