import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";

export const getProfile = protectedProcedure.query(async ({ ctx }) => {
  const { prisma, session } = ctx;
  const userId = session.user.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in",
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  return {
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
  };
});

export type GetProfileOutput = inferProcedureOutput<typeof getProfile>;
