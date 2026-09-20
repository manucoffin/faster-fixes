import { prisma } from "@workspace/db";
import slugify from "slugify";

export async function getUniqueOrganizationSlug(
  name: string,
  existingOrganizationId?: string,
) {
  const slug = slugify(name, { lower: true, strict: true });
  let counter = 0;
  let finalSlug = slug;

  // Keep checking until we find an available slug
  while (true) {
    const existingOrganization = await prisma.organization.findFirst({
      where: {
        slug: finalSlug,
        // Exclude the current organization when one is being renamed.
        ...(existingOrganizationId
          ? { id: { not: existingOrganizationId } }
          : {}),
      },
    });

    if (!existingOrganization) {
      break;
    }

    counter++;
    finalSlug = `${slug}-${counter}`;
  }

  return finalSlug;
}

export type GetUniqueOrganizationSlugOutput = Awaited<
  ReturnType<typeof getUniqueOrganizationSlug>
>;
