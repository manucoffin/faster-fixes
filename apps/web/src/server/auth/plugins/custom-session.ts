import { prisma } from "@workspace/db";
import { customSession } from "better-auth/plugins";

export const customSessionPlugin = customSession(async ({ user, session }) => {
  // Get the current session record from the database to access impersonatedBy
  const currentSessionRecord = await prisma.session.findUnique({
    where: {
      id: session.id,
    },
    select: {
      impersonatedBy: true,
    },
  });

  const userData = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
    select: {
      role: true,
      onboardingCompleted: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    user: {
      ...user,
      firstName: userData?.profile?.firstName,
      lastName: userData?.profile?.lastName,
      role: userData?.role || "user",
      onboardingCompleted: userData?.onboardingCompleted,
    },
    session: {
      ...session,
      impersonatedBy: currentSessionRecord?.impersonatedBy,
    },
  };
});
