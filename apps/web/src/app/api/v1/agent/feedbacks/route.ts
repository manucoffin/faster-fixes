import { formatFeedbackListAsMarkdown } from "@/app/_features/feedback/format-feedback-markdown";
import { hasScope } from "@/server/api/check-agent-scope";
import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveAgentToken } from "@/server/api/resolve-agent-token";
import {
  checkResourceLimit,
  resolveOrganizationPlan,
} from "@/server/auth/subscription";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { prisma } from "@workspace/db";
import { Prisma } from "@workspace/db/generated/prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  CreateFeedbacksSchema,
  ListFeedbacksQuerySchema,
} from "../agent.schema";

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

const DEFAULT_IMPORT_REVIEWER_NAME = "Imported feedback";

async function getOrCreateImportReviewer(projectId: string, name: string) {
  const existing = await prisma.reviewer.findFirst({
    where: { projectId, name },
  });
  if (existing) {
    if (!existing.isActive) {
      return prisma.reviewer.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing;
  }

  // The reviewer.token column is unique and required, but imported reviewers
  // never authenticate via the widget — generate an unguessable hashed value.
  const rawToken = `imported_${crypto.randomUUID()}`;
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return prisma.reviewer.create({
    data: { projectId, name, token: tokenHash, isActive: true },
  });
}

// POST /api/v1/agent/feedbacks — bulk-create feedback (used for migrating
// from other tools like BugHerd, Marker.io, Userback, Usersnap). Skips the
// `feedback/created` Inngest event so imports don't fan out into integrations
// (e.g. opening hundreds of GitHub issues).
export async function POST(req: NextRequest) {
  const agentToken = await resolveAgentToken(req.headers.get("authorization"));
  if (!agentToken) {
    return agentError("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (!hasScope(agentToken.scopes, "feedbacks:create")) {
    return agentError("Insufficient permissions", "FORBIDDEN", 403);
  }

  const allowed = await checkRateLimit(agentToken.tokenHash, "agent:write");
  if (!allowed) {
    return agentError("Rate limit exceeded", "RATE_LIMITED", 429);
  }

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

  const projectId = resolveProjectId(project, agentToken.organization.projects);
  if (!projectId) {
    return agentError("Project not found", "NOT_FOUND", 404);
  }

  // Reject the whole batch upfront if it would cross the plan limit, so the
  // caller can split or upgrade rather than landing in a half-imported state.
  const plan = await resolveOrganizationPlan(
    agentToken.organization.id,
    prisma,
  );
  const limit = plan.limits.feedbacks as number;
  if (limit !== Infinity) {
    const currentCount = await prisma.feedback.count({
      where: { project: { organizationId: agentToken.organization.id } },
    });
    if (currentCount + feedbacks.length > limit) {
      return NextResponse.json(
        {
          error: "Feedback limit would be exceeded by this batch.",
          code: "RESOURCE_LIMIT_EXCEEDED",
          current: currentCount,
          limit,
          requested: feedbacks.length,
        },
        { status: 403 },
      );
    }
  }

  const reviewer = await getOrCreateImportReviewer(
    projectId,
    reviewer_name ?? DEFAULT_IMPORT_REVIEWER_NAME,
  );

  const created = await prisma.$transaction(
    feedbacks.map((f) => {
      const baseMetadata = f.metadata ?? {};
      const metadata: Prisma.InputJsonObject = source
        ? { ...baseMetadata, source }
        : baseMetadata;
      const hasMetadata = Object.keys(metadata).length > 0;

      return prisma.feedback.create({
        data: {
          projectId,
          reviewerId: reviewer.id,
          comment: f.comment,
          pageUrl: f.pageUrl,
          status: f.status ?? "new",
          selector: f.selector,
          clickX: f.clickX,
          clickY: f.clickY,
          browserName: f.browserName,
          browserVersion: f.browserVersion,
          os: f.os,
          viewportWidth: f.viewportWidth,
          viewportHeight: f.viewportHeight,
          metadata: hasMetadata ? metadata : undefined,
          createdAt: f.createdAt ? new Date(f.createdAt) : undefined,
        },
        select: {
          id: true,
          status: true,
          comment: true,
          pageUrl: true,
          createdAt: true,
        },
      });
    }),
  );

  // Tell the caller whether they're now at the cap so they know to pause
  // before queuing another batch.
  const postCheck = await checkResourceLimit(
    agentToken.organization.id,
    "feedbacks",
    prisma,
  );

  console.info(
    `[agent-api] feedbacks:create tokenId=${agentToken.id} project=${projectId} count=${created.length} source=${source ?? "n/a"} reviewer=${reviewer.id}`,
  );

  return NextResponse.json(
    {
      created: created.length,
      feedbacks: created,
      reviewer: { id: reviewer.id, name: reviewer.name },
      atLimit: !postCheck.allowed,
    },
    { status: 201 },
  );
}
