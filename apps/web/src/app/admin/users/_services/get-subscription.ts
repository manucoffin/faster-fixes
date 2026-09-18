import { prisma } from "@workspace/db";

export async function getSubscription({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      members: {
        where: {
          organization: {
            isDefault: true,
          },
        },
        select: {
          organization: {
            select: {
              subscription: {
                select: {
                  id: true,
                  status: true,
                  periodEnd: true,
                  periodStart: true,
                  cancelAtPeriodEnd: true,
                  trialStart: true,
                  trialEnd: true,
                  stripeCustomerId: true,
                  stripeSubscriptionId: true,
                  plan: true,
                  organizationId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // A User without a default Organization, or one whose Organization has no
  // Subscription, is a free account rather than an error.
  return user?.members[0]?.organization?.subscription ?? null;
}

export type GetSubscriptionOutput = Awaited<ReturnType<typeof getSubscription>>;
