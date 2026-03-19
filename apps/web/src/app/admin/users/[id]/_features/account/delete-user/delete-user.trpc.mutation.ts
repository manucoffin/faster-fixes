import { adminProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { DeleteUserSchema } from "./delete-user.schema";

export const deleteUser = adminProcedure
  .input(DeleteUserSchema)
  .mutation(async ({ input, ctx }) => {
    const { userId } = input;

    // Verify user exists before deletion
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Delete the user
    const deletedUser = await ctx.prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    return { success: true, user: deletedUser };
  });
