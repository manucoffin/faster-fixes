import { prisma } from "@workspace/db";

export async function completeOnboarding({ userId }: { userId: string }) {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });

  return { success: true };
}
