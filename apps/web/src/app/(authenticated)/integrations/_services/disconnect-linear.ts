import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { decryptToken } from "@/server/linear/crypto";
import { revokeAccessToken } from "@/server/linear/linear-client";
import { prisma } from "@workspace/db";

export async function disconnectLinear(
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
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can disconnect Linear.");
  }

  const installation = await db.linearInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    select: { accessToken: true },
  });

  // Revoke on Linear's side first so the workspace admin's "Connected apps" list
  // clears and reconnect doesn't hit Linear's "already installed" short-circuit.
  // Failing local cleanup if revoke errors would strand the user; log and proceed.
  if (installation) {
    try {
      const accessToken = decryptToken(installation.accessToken);
      await revokeAccessToken(accessToken);
    } catch (err) {
      console.warn("[linear] revoke failed during disconnect:", err);
    }
  }

  await db.linearInstallation.deleteMany({
    where: { organizationId: activeOrganization.id },
  });

  return { success: true };
}
