import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function getGitHubInstallation(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // The denial reads the loaded membership, so it belongs here rather than at
  // the transport edge. Any member may read the installation.
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const installation = await db.gitHubInstallation.findFirst({
    where: { organizationId: activeOrganization.id },
    include: {
      installedBy: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!installation) return null;

  return {
    id: installation.id,
    installationId: installation.installationId,
    accountLogin: installation.accountLogin,
    accountType: installation.accountType,
    accountAvatarUrl: installation.accountAvatarUrl,
    installedByName: installation.installedBy?.user.name ?? null,
    createdAt: installation.createdAt,
  };
}

export type GetGitHubInstallationOutput = Awaited<
  ReturnType<typeof getGitHubInstallation>
>;
