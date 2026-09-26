import { prisma } from "@workspace/db";
import slugify from "slugify";

export async function getUniqueOrganizationSlug(
  name: string,
  existingOrganizationId?: string,
) {
  const slug = slugify(name, { lower: true, strict: true });

  const isSlugTaken = async (candidate: string) => {
    const existingOrganization = await prisma.organization.findFirst({
      where: {
        slug: candidate,
        // Exclude the current organization when one is being renamed.
        ...(existingOrganizationId
          ? { id: { not: existingOrganizationId } }
          : {}),
      },
    });
    return existingOrganization !== null;
  };

  let counter = 0;
  let finalSlug = slug;

  while (await isSlugTaken(finalSlug)) {
    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  return finalSlug;
}

export type GetUniqueOrganizationSlugOutput = Awaited<
  ReturnType<typeof getUniqueOrganizationSlug>
>;
