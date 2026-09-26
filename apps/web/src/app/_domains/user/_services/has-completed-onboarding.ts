import { prisma } from "@workspace/db";

// Reads the flag from the database rather than the session: Better Auth caches
// the session cookie for five minutes, so a just-finished onboarding would
// still look pending.
export async function hasCompletedOnboarding(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true },
  });

  return user?.onboardingCompleted ?? false;
}

export type HasCompletedOnboardingOutput = Awaited<
  ReturnType<typeof hasCompletedOnboarding>
>;
