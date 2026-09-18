import { prisma } from "@workspace/db";
import { getUniqueOrganizationSlug } from "./get-unique-organization-slug";

export async function createOrganization({
  name,
  ownerId,
}: {
  name: string;
  ownerId: string;
}) {
  const slug = await getUniqueOrganizationSlug(name);

  const organization = await prisma.organization.create({
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
