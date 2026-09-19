import {
  checkResourceLimit,
  resolveOrganizationPlan,
} from "@/server/auth/subscription";
import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { Prisma } from "@workspace/db/generated/prisma/client";
import { resolveProjectId } from "../../_helpers/resolve-project-id";
import type { CreateFeedbackItemInput } from "../../_services/agent.schema";
import {
  DEFAULT_IMPORT_REVIEWER_NAME,
  getOrCreateImportReviewer,
} from "./get-or-create-import-reviewer";

type CreateFeedbacksInput = {
  /** Public ID or internal ID, as the caller sent it. */
  project: string;
  /** The Agent token's Organization: the plan the batch is measured against. */
  organizationId: string;
  /** The projects that Organization owns: the write's whole scope. */
  organizationProjects: Array<{ id: string; publicId: string }>;
  reviewerName?: string;
  source?: string;
  feedbacks: CreateFeedbackItemInput[];
};

/**
 * Bulk-create feedback (used for migrating from other tools like BugHerd,
 * Marker.io, Userback, Usersnap). Skips the `feedback/created` Inngest event
 * so imports don't fan out into integrations (e.g. opening hundreds of GitHub
 * issues).
 *
 * A plan limit is not a domain error: it comes back as data, so the HTTP
 * boundary can answer with its own `RESOURCE_LIMIT_EXCEEDED` contract.
 */
export async function createFeedbacks(
  {
    project,
    organizationId,
    organizationProjects,
    reviewerName,
    source,
    feedbacks,
  }: CreateFeedbacksInput,
  db: typeof prisma = prisma,
) {
  const projectId = resolveProjectId(project, organizationProjects);

  if (!projectId) {
    // No period: this copy is the published agent API contract.
    throw new NotFoundError("Project not found");
  }

  // Reject the whole batch upfront if it would cross the plan limit, so the
  // caller can split or upgrade rather than landing in a half-imported state.
  const plan = await resolveOrganizationPlan(organizationId, db);
  const limit = plan.limits.feedbacks as number;
  if (limit !== Infinity) {
    const current = await db.feedback.count({
      where: { project: { organizationId } },
    });
    if (current + feedbacks.length > limit) {
      return {
        limitExceeded: true as const,
        current,
        limit,
        requested: feedbacks.length,
      };
    }
  }

  const reviewer = await getOrCreateImportReviewer(
    projectId,
    reviewerName ?? DEFAULT_IMPORT_REVIEWER_NAME,
    db,
  );

  const created = await db.$transaction(
    feedbacks.map((f) => {
      const baseMetadata = f.metadata ?? {};
      const metadata: Prisma.InputJsonObject = source
        ? { ...baseMetadata, source }
        : baseMetadata;
      const hasMetadata = Object.keys(metadata).length > 0;

      return db.feedback.create({
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
  const postCheck = await checkResourceLimit(organizationId, "feedbacks", db);

  // `projectId` and the reviewer travel back so the boundary can name both in
  // its access log without resolving them a second time.
  return {
    limitExceeded: false as const,
    projectId,
    feedbacks: created,
    reviewer: { id: reviewer.id, name: reviewer.name },
    atLimit: !postCheck.allowed,
  };
}

export type CreateFeedbacksOutput = Awaited<ReturnType<typeof createFeedbacks>>;
