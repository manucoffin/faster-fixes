import { generateApiKey } from "@/app/_domains/project/_helpers/generate-api-key";
import { generatePublicId } from "@/app/_domains/project/_helpers/generate-public-id";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function createProject(
  {
    organizationId,
    userId,
    name,
    domain,
  }: {
    organizationId: string;
    userId: string;
    name: string;
    domain: string;
  },
  db: typeof prisma = prisma,
) {
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  // The denial needs the loaded membership, so it belongs here rather than at
  // the transport edge.
  if (!membership) {
    throw new ForbiddenError("You do not have permission to create a project.");
  }

  const { raw, hash, lastFour } = generateApiKey();

  const project = await db.project.create({
    data: {
      name,
      domain,
      publicId: generatePublicId(),
      apiKeyHash: hash,
      apiKeyLastFour: lastFour,
      organizationId,
      widgetConfig: {
        create: {},
      },
    },
  });

  return {
    id: project.id,
    name: project.name,
    publicId: project.publicId,
    rawApiKey: raw,
  };
}
