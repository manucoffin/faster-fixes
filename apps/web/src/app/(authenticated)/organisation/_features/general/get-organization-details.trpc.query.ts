"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const getOrganizationDetails = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas accès à cette organisation.",
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: input.organizationId },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organisation introuvable.",
      });
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      isDefault: org.isDefault,
    };
  });
