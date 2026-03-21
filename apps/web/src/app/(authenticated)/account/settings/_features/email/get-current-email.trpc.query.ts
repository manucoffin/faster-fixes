import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";

export const getCurrentEmail = protectedProcedure.query(async ({ ctx }) => {
  const { prisma, session } = ctx;
  const userId = session.user.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return {
    currentEmail: user.email,
    emailVerified: user.emailVerified,
  };
});

export type GetCurrentEmailOutput = inferProcedureOutput<typeof getCurrentEmail>;
