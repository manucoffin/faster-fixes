import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function disconnectGitHub(
  { headers, userId }: { headers: Headers; userId: string },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: "owner",
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "Only the organization owner can disconnect GitHub.",
    );
  }

  await db.gitHubInstallation.deleteMany({
    where: { organizationId: activeOrganization.id },
  });

  return { success: true };
}
