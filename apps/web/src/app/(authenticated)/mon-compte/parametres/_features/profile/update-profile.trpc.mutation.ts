import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { UpdateProfileSchema } from "./update-profile.schema";

export const updateProfile = protectedProcedure
  .input(UpdateProfileSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;
    const userId = session.user.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Vous devez être connecté",
      });
    }

    // Find or create profile
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
      },
      create: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    return profile;
  });

export type UpdateProfileOutput = inferProcedureOutput<typeof updateProfile>;
