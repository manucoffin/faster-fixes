import { prisma } from "@workspace/db";

/**
 * The photo objects of a User's Testimonials. Read before the User is deleted:
 * the rows cascade away with the User, the storage objects do not.
 */
export async function listTestimonialPhotoKeys(
  { userId }: { userId: string },
  db: typeof prisma = prisma,
) {
  const testimonials = await db.testimonial.findMany({
    where: { userId, photoKey: { not: null } },
    select: { photoKey: true },
  });

  return testimonials.flatMap(({ photoKey }) => (photoKey ? [photoKey] : []));
}

export type ListTestimonialPhotoKeysOutput = Awaited<
  ReturnType<typeof listTestimonialPhotoKeys>
>;
