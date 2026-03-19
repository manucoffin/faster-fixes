import { prisma } from "@workspace/db";

export async function getUserInformation(userId: string) {
  return await prisma.user.findFirst({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      onboardingCompleted: true,
      emailVerified: true,
      marketingPreferences: {
        select: {
          acceptsNewsletter: true,
        },
      },
      members: {
        where: {
          organization: {
            isDefault: true,
          },
        },
        select: {
          organization: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
}

export type GetUserInformationOutput = Awaited<
  ReturnType<typeof getUserInformation>
>;
