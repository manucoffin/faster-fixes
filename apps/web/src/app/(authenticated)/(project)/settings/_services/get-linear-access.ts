import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { decryptToken } from "@/app/_domains/integration/_services/linear/token-crypto";
import { getLinearClient } from "@/app/_domains/integration/_services/linear/linear-client";
import { prisma } from "@workspace/db";

/**
 * Resolves the Organization the caller administrates, and returns a Linear
 * client authenticated with that Organization's installation. The two team
 * lookups of the link form need this same preamble; unlike the Jira twin it
 * starts from the caller's privileged membership, because the pickers run
 * before any team is attached to a Project.
 */
export async function getLinearAccess(
  { userId }: { userId: string },
  db: typeof prisma = prisma,
) {
  const member = await db.member.findFirst({
    where: { userId, role: { in: ["owner", "admin"] } },
    select: { organizationId: true },
  });

  if (!member) {
    throw new ForbiddenError("Access denied.");
  }

  const installation = await db.linearInstallation.findUnique({
    where: { organizationId: member.organizationId },
    select: { accessToken: true },
  });

  if (!installation) {
    throw new BadRequestError("Linear is not connected.");
  }

  return {
    organizationId: member.organizationId,
    client: getLinearClient(decryptToken(installation.accessToken)),
  };
}

export type GetLinearAccessOutput = Awaited<ReturnType<typeof getLinearAccess>>;
