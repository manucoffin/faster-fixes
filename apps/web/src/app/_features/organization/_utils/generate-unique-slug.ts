import { prisma } from "@workspace/db/index";
import slugify from "slugify";

export async function generateUniqueSlug(name: string, existingId?: string) {
  const slug = slugify(name, { lower: true, strict: true });
  let counter = 0;
  let finalSlug = slug;

  // Keep checking until we find an available slug
  while (true) {
    const existingOrganization = await prisma.organization.findFirst({
      where: {
        slug: finalSlug,
        ...(existingId ? { id: { not: existingId } } : {}), // Exclude current organization if id provided
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
