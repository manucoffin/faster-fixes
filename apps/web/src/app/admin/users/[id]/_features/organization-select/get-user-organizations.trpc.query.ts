import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

export const getUserOrganizations = adminProcedure
  .input(
    z.object({
      userId: z.string().min(1),
    })
  )
  .query(async ({ input, ctx }) => {
    const organizations = await ctx.prisma.member.findMany({
      where: {
        userId: input.userId,
      },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return organizations.map((member) => ({
      id: member.organization.id,
      name: member.organization.name,
      slug: member.organization.slug,
    }));
  });

export type GetUserOrganizationsOutput = inferProcedureOutput<
  typeof getUserOrganizations
>;
