import { prisma } from "@workspace/db";

export async function findUserName({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return user?.name ?? null;
}

export type FindUserNameOutput = Awaited<ReturnType<typeof findUserName>>;
