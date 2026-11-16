import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function getTrelloInstallation(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // Any member may read the installation; only owners may disconnect it.
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied.");
  }

  const installation = await db.trelloInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    include: {
      installedBy: { include: { user: { select: { name: true } } } },
    },
  });

  if (!installation) return null;

  return {
    id: installation.id,
    memberDisplayName: installation.memberDisplayName,
    healthState: installation.healthState,
    installedByName: installation.installedBy?.user.name ?? null,
    createdAt: installation.createdAt,
    canDisconnect: membership.role === "owner",
  };
}

export type GetTrelloInstallationOutput = Awaited<
  ReturnType<typeof getTrelloInstallation>
>;
