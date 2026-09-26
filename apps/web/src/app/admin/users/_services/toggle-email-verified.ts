import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { ToggleEmailVerifiedInput } from "./toggle-email-verified.schema";

export async function toggleEmailVerified(
  { userId, emailVerified }: ToggleEmailVerifiedInput,
  db: typeof prisma = prisma,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  // The denial needs the loaded User, so it belongs here rather than at the
  // transport edge.
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return db.user.update({
    where: { id: userId },
    data: { emailVerified },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });
}

export type ToggleEmailVerifiedOutput = Awaited<
  ReturnType<typeof toggleEmailVerified>
>;
