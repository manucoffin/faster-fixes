import { checkOrganizationLimit } from "@/server/auth/subscription";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { getUniqueOrganizationSlug } from "./get-unique-organization-slug";

export async function createOrganization(
  {
    name,
    ownerId,
  }: {
    name: string;
    ownerId: string;
  },
  db: typeof prisma = prisma,
) {
  // The Plan's Organization limit is a fact about the owner and their existing
  // memberships, so it is decided where the Organization is created.
  const organizationCheck = await checkOrganizationLimit(ownerId, db);

  if (!organizationCheck.allowed) {
    const { current, limit } = organizationCheck.denial.metadata;

    throw new ForbiddenError(
      `You've reached the organizations limit for your plan (${current}/${limit}). Upgrade to get more.`,
    );
  }

  const slug = await getUniqueOrganizationSlug(name);

  const organization = await db.organization.create({
    data: {
      name,
      slug,
      members: {
        create: [
          {
            userId: ownerId,
            role: "owner",
          },
        ],
      },
    },
  });

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  };
}

export type CreateOrganizationOutput = Awaited<
  ReturnType<typeof createOrganization>
>;
