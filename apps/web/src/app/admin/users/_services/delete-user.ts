import { deleteTestimonialPhotos } from "@/app/_domains/testimonial/_services/delete-testimonial-photos";
import { listTestimonialPhotoKeys } from "@/app/_domains/testimonial/_services/list-testimonial-photo-keys";
import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function deleteUser(
  { userId }: { userId: string },
  db: typeof prisma = prisma,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  // The denial needs the loaded User, so it belongs here rather than at the
  // transport edge.
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const photoKeys = await listTestimonialPhotoKeys({ userId }, db);

  const deletedUser = await db.user.delete({
    where: { id: userId },
    select: { id: true, email: true },
  });

  await deleteTestimonialPhotos({ keys: photoKeys });

  return { success: true, user: deletedUser };
}
