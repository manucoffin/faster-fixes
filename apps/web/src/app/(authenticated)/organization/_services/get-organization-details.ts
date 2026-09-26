import { ForbiddenError, NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function getOrganizationDetails(
  {
    organizationId,
    userId,
  }: {
    organizationId: string;
    userId: string;
  },
  db: typeof prisma = prisma,
) {
  // Both denials need the loaded membership and Organization, so they belong
  // here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (!membership) {
    throw new ForbiddenError("You do not have access to this organization.");
  }

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo,
    isDefault: organization.isDefault,
  };
}

export type GetOrganizationDetailsOutput = Awaited<
  ReturnType<typeof getOrganizationDetails>
>;
