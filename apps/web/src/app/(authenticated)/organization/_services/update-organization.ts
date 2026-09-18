import { getUniqueOrganizationSlug } from "@/app/_domains/organization/_services/get-unique-organization-slug";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { UpdateOrganizationInput } from "./update-organization.schema";

export async function updateOrganization(
  {
    organizationId,
    name,
    userId,
  }: UpdateOrganizationInput & { userId: string },
  db: typeof prisma = prisma,
) {
  // The denial needs the loaded membership and its role, so it belongs here.
  const membership = await db.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError(
      "You do not have permission to edit this organization.",
    );
  }

  const slug = await getUniqueOrganizationSlug(name, organizationId);

  const organization = await db.organization.update({
    where: { id: organizationId },
    data: {
      name,
      slug,
    },
  });

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  };
}
