"use server";

import { s3Client } from "@/server/storage";
import { protectedProcedure } from "@/server/trpc/trpc";
import { deleteObject } from "@better-upload/server/helpers";
import { inferProcedureOutput } from "@trpc/server";
import z from "zod";

const UpdateAvatarSchema = z.object({
  imageKey: z.string(),
});

export const updateAvatar = protectedProcedure
  .input(UpdateAvatarSchema)
  .mutation(async ({ input, ctx }) => {
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

    // Update user image in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: input.imageKey },
    });
  });

export type UpdateAvatarOutput = inferProcedureOutput<typeof updateAvatar>;
