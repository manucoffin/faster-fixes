import { prisma } from "@workspace/db";
import { UpdateProfileInput } from "./update-profile.schema";

export async function updateProfile({
  userId,
  firstName,
  lastName,
}: UpdateProfileInput & { userId: string }) {
  return prisma.profile.upsert({
    where: { userId },
    update: {
      firstName,
      lastName,
    },
    create: {
      userId,
      firstName,
      lastName,
    },
  });
}
