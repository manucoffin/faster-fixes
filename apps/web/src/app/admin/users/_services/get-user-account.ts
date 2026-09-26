import { prisma } from "@workspace/db";

export async function getUserAccount({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      accounts: { select: { providerId: true } },
    },
  });

  return {
    email: user?.email ?? null,
    // Only a credential account has a password to reset; an OAuth-only User
    // gets no reset action.
    hasCredentialProvider:
      user?.accounts.some((account) => account.providerId === "credential") ??
      false,
  };
}

export type GetUserAccountOutput = Awaited<ReturnType<typeof getUserAccount>>;
