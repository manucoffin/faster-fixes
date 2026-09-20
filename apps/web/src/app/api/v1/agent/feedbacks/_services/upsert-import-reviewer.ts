import { prisma } from "@workspace/db";
import crypto from "crypto";

export const DEFAULT_IMPORT_REVIEWER_NAME = "Imported feedback";

/**
 * The Reviewer an import attributes its Feedback to: the existing one under
 * that name, reactivated if it had been deactivated, or a new one.
 *
 * Named `upsert-` rather than `get-or-create-`: it writes, and a read verb
 * promises it does not.
 *
 * Imported reviewers never authenticate via the widget, but `reviewer.token`
 * is unique + required — generate an unguessable hashed value to fill it.
 */
export async function upsertImportReviewer(
  projectId: string,
  name: string,
  db: typeof prisma = prisma,
) {
  const existing = await db.reviewer.findFirst({
    where: { projectId, name },
  });
  if (existing) {
    if (!existing.isActive) {
      return db.reviewer.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing;
  }

  const rawToken = `imported_${crypto.randomUUID()}`;
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return db.reviewer.create({
    data: { projectId, name, token: tokenHash, isActive: true },
  });
}

export type UpsertImportReviewerOutput = Awaited<
  ReturnType<typeof upsertImportReviewer>
>;
