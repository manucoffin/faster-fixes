"use server";

import { generateUniqueSlug } from "@/app/_features/organization/_utils/generate-unique-slug";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { UpdateOrganizationSchema } from "./update-organization.schema";

export const updateOrganization = protectedProcedure
  .input(UpdateOrganizationSchema)
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

    const slug = await generateUniqueSlug(input.name, input.organizationId);

    const org = await prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        name: input.name,
        slug,
      },
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
    };
  });
