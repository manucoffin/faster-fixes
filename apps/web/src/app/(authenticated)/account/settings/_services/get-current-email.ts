import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";

export async function getCurrentEmail(
  { userId }: { userId: string },
  db: typeof prisma = prisma,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  // The denial needs the loaded User, so it belongs here rather than at the
  // transport edge.
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    currentEmail: user.email,
    emailVerified: user.emailVerified,
  };
}

export type GetCurrentEmailOutput = Awaited<ReturnType<typeof getCurrentEmail>>;
