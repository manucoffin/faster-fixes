import {
  checkResourceLimit,
  resolveOrganizationPlan,
} from "@/server/auth/subscription";
import { prisma } from "@workspace/db";
import { Prisma } from "@workspace/db/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { agentError } from "../../_utils/agent-error";
import { CreateFeedbacksSchema } from "../../_utils/agent.schema";
import {
  isAuthFailure,
  requireAgentAuth,
} from "../../_utils/require-agent-auth";
import { resolveProjectId } from "../../_utils/resolve-project-id";
import {
  DEFAULT_IMPORT_REVIEWER_NAME,
  getOrCreateImportReviewer,
} from "./get-or-create-import-reviewer";

/**
 * Bulk-create feedback (used for migrating from other tools like BugHerd,
 * Marker.io, Userback, Usersnap). Skips the `feedback/created` Inngest event
 * so imports don't fan out into integrations (e.g. opening hundreds of GitHub
 * issues).
 */
export async function createFeedbacks(req: NextRequest) {
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
