import { generateApiKey } from "@/app/_domains/project/_helpers/generate-api-key";
import { generatePublicId } from "@/app/_domains/project/_helpers/generate-public-id";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function createOnboardingProject(
  { userId, name, domain }: { userId: string; name: string; domain: string },
  db: typeof prisma = prisma,
) {
  const membership = await db.member.findFirst({
    where: { userId, role: "owner" },
    select: { organizationId: true },
  });

  // The denial needs the loaded membership, so it belongs here rather than at
  // the transport edge.
  if (!membership) {
    throw new ForbiddenError("No organization found.");
  }

  // Handle refresh scenario: project already created during a previous attempt
  const existingProject = await db.project.findFirst({
    where: { organizationId: membership.organizationId },
    select: { id: true, name: true, publicId: true },
  });

  if (existingProject) {
    return {
      id: existingProject.id,
      name: existingProject.name,
      publicId: existingProject.publicId,
      rawApiKey: null,
    };
  }

  const { raw, hash, lastFour } = generateApiKey();

  const project = await db.project.create({
    data: {
      name,
      domain,
      publicId: generatePublicId(),
      apiKeyHash: hash,
      apiKeyLastFour: lastFour,
      organizationId: membership.organizationId,
      widgetConfig: { create: {} },
    },
  });

  return {
    id: project.id,
    name: project.name,
    publicId: project.publicId,
    rawApiKey: raw,
  };
}
