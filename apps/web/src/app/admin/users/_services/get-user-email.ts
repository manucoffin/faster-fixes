import { prisma } from "@workspace/db";

export async function getUserEmail({ userId }: { userId: string }) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });
}

export type GetUserEmailOutput = Awaited<ReturnType<typeof getUserEmail>>;
