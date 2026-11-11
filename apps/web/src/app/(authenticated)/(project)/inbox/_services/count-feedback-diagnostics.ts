import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import type { DiagnosticTrail } from "@fasterfixes/core";
import { prisma } from "@workspace/db";
import type { CountFeedbackDiagnosticsInput } from "./count-feedback-diagnostics.schema";

/**
 * The console errors and failed requests of one Feedback's Diagnostic Trail,
 * for the Recording row. Read when the detail panel opens so the inbox list
 * never loads the trail.
 */
export async function countFeedbackDiagnostics(
  { feedbackId, userId }: CountFeedbackDiagnosticsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const feedback = await db.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      diagnosticTrail: true,
      project: { select: { organizationId: true } },
    },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found.");
  }

  const membership = await db.member.findFirst({
    where: { organizationId: feedback.project.organizationId, userId },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const trail = feedback.diagnosticTrail as DiagnosticTrail | null;
  return {
    consoleErrors:
      trail?.console.filter((entry) => entry.level === "error").length ?? 0,
    // A status of 0 is a request that never got a response.
    failedRequests:
      trail?.network.filter(
        (entry) => entry.status === 0 || entry.status >= 400,
      ).length ?? 0,
  };
}

export type CountFeedbackDiagnosticsOutput = Awaited<
  ReturnType<typeof countFeedbackDiagnostics>
>;
