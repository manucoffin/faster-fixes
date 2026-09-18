import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { decryptToken } from "@/server/linear/crypto";
import { getLinearClient } from "@/server/linear/linear-client";
import { prisma } from "@workspace/db";

export async function listAccessibleLinearTeams(
  { userId, headers }: { userId: string; headers: Headers },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // The privileged-membership denial needs the resolved Organization, so it
  // lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can list teams.");
  }

  const installation = await db.linearInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    select: { accessToken: true },
  });

  // An Organization with no installation has no team to offer, and the section
  // renders its connect prompt instead of an error.
  if (!installation) return [];

  const client = getLinearClient(decryptToken(installation.accessToken));
  const teams = await client.teams();
  return teams.nodes.map((t) => ({
    id: t.id,
    key: t.key,
    name: t.name,
  }));
}

export type ListAccessibleLinearTeamsOutput = Awaited<
  ReturnType<typeof listAccessibleLinearTeams>
>;
