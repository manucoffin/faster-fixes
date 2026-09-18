import { generateApiKey } from "@/app/_domains/project/_helpers/generate-api-key";
import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { RegenerateApiKeyInput } from "./regenerate-api-key.schema";

export async function regenerateApiKey(
  { projectId, userId }: RegenerateApiKeyInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  // Membership in the Project's Organization needs the loaded Project, so the
  // denial lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: project.organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const { raw, hash, lastFour } = generateApiKey();

  await db.project.update({
    where: { id: projectId },
    data: { apiKeyHash: hash, apiKeyLastFour: lastFour },
  });

  return { rawApiKey: raw };
}
