"use server";

import { s3Client } from "@/server/storage";
import { protectedProcedure } from "@/server/trpc/trpc";
import { deleteObject } from "@better-upload/server/helpers";
import { TRPCError } from "@trpc/server";
import z from "zod";

const UpdateOrganizationLogoSchema = z.object({
  organizationId: z.string(),
});

export const updateOrganizationLogo = protectedProcedure
  .input(UpdateOrganizationLogoSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Vous n'avez pas les permissions pour modifier cette organisation.",
      });
    }

    // Delete previous logo object from R2 if one exists
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      select: { logo: true },
    });

    if (org.logo) {
      try {
        await deleteObject(s3Client, {
          bucket: process.env.STORAGE_BUCKET_NAME!,
          key: org.logo,
        });
      } catch (error) {
        console.error(
          `Failed to delete old logo from R2 (key=${org.logo}):`,
          error,
        );
      }
    }
  });
