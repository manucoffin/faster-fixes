import { prisma } from "@workspace/db";

export async function getProfile({ userId }: { userId: string }) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  return {
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
  };
}

export type GetProfileOutput = Awaited<ReturnType<typeof getProfile>>;
