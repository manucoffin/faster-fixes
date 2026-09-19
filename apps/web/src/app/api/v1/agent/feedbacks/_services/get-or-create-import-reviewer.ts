import { prisma } from "@workspace/db";
import crypto from "crypto";

export const DEFAULT_IMPORT_REVIEWER_NAME = "Imported feedback";

/**
 * Imported reviewers never authenticate via the widget, but `reviewer.token`
 * is unique + required — generate an unguessable hashed value to fill it.
 */
export async function getOrCreateImportReviewer(
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

export type GetOrCreateImportReviewerOutput = Awaited<
  ReturnType<typeof getOrCreateImportReviewer>
>;
