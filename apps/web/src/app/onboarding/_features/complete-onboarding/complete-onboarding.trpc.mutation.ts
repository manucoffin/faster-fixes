"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";

export const completeOnboarding = protectedProcedure.mutation(
  async ({ ctx }) => {
    const { prisma, session } = ctx;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    return { success: true };
  },
);

export type CompleteOnboardingOutput = inferProcedureOutput<
  typeof completeOnboarding
>;
