"use server";

import { s3Client } from "@/server/storage";
import { protectedProcedure } from "@/server/trpc/trpc";
import { deleteObject } from "@better-upload/server/helpers";
import { inferProcedureOutput } from "@trpc/server";

export const updateAvatar = protectedProcedure.mutation(async ({ ctx }) => {
  const { prisma, session } = ctx;

  // Delete previous avatar from R2 if one exists
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { image: true },
  });

  if (user.image && !user.image.startsWith("http")) {
    try {
      await deleteObject(s3Client, {
        bucket: process.env.STORAGE_BUCKET_NAME!,
        key: user.image,
      });
    } catch (error) {
      console.error(
        `Failed to delete old avatar from R2 (key=${user.image}):`,
        error,
      );
    }
  }
});

export type UpdateAvatarOutput = inferProcedureOutput<typeof updateAvatar>;
