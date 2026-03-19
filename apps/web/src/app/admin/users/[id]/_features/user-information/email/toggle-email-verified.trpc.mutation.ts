import { adminProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const toggleEmailVerified = adminProcedure
  .input(
    z.object({
      userId: z.string().min(1),
      emailVerified: z.boolean(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const updatedUser = await ctx.prisma.user.update({
      where: { id: input.userId },
      data: {
        emailVerified: input.emailVerified,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    return updatedUser;
  });
