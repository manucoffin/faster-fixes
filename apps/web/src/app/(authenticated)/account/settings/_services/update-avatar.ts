import { s3Client } from "@/server/storage";
import { requireEnv } from "@/utils/environment/require-env";
import { deleteObject } from "@better-upload/server/helpers";
import { prisma } from "@workspace/db";

export async function updateAvatar({ userId }: { userId: string }) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { image: true },
  });

  // An absolute URL is an OAuth provider avatar, which lives outside the
  // bucket and has nothing to delete.
  if (user.image && !user.image.startsWith("http")) {
    try {
      await deleteObject(s3Client, {
        bucket: requireEnv(
          "STORAGE_BUCKET_NAME",
          process.env.STORAGE_BUCKET_NAME,
        ),
        key: user.image,
      });
    } catch (error) {
      console.error(
        `Failed to delete old avatar from R2 (key=${user.image}):`,
        error,
      );
    }
  }
}
