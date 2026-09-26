import { resetPasswordUrl } from "@/app/_constants/routes";
import { auth } from "@/server/auth";
import { BadRequestError, NotFoundError } from "@/server/errors/domain-errors";
import { getAppUrl } from "@/utils/url/get-app-url";
import { prisma } from "@workspace/db";

export async function requestPasswordReset(
  { userId, headers }: { userId: string; headers: Headers },
  db: typeof prisma = prisma,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      accounts: { select: { providerId: true } },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const hasCredentialProvider = user.accounts.some(
    (account) => account.providerId === "credential",
  );

  if (!hasCredentialProvider) {
    throw new BadRequestError("User does not have a credential-based account");
  }

  await auth.api.requestPasswordReset({
    body: {
      email: user.email,
      redirectTo: `${getAppUrl()}${resetPasswordUrl}`,
    },
    headers,
  });

  return { success: true };
}
