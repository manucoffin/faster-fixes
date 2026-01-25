import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

export const getUserEmail = adminProcedure
  .input(
    z.object({
      userId: z.string().min(1),
    }),
  )
  .query(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    return user;
  });

export type AdminUsersGetUserEmail = inferProcedureOutput<
  typeof getUserEmail
>;
