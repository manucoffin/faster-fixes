import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import type { DiagnosticTrail } from "@fasterfixes/core";
import { prisma } from "@workspace/db";
import { GetFeedbackDiagnosticsInput } from "./get-feedback-diagnostics.schema";

// Dedicated lazy read for the Diagnostic Trail. Kept separate from the inbox
// `listFeedback` read so the (potentially ~64 KB) trail is fetched only when
// the dashboard modal opens, never for every feedback in the inbox.
export async function getFeedbackDiagnostics(
  {
    projectId,
    feedbackId,
    userId,
  }: GetFeedbackDiagnosticsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: { organizationId: project.organizationId, userId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, projectId },
    select: { diagnosticTrail: true },
  });

  if (!feedback) {
    throw new NotFoundError("Feedback not found.");
  }

  return (feedback.diagnosticTrail ?? null) as DiagnosticTrail | null;
}

export type GetFeedbackDiagnosticsOutput = Awaited<
  ReturnType<typeof getFeedbackDiagnostics>
>;
