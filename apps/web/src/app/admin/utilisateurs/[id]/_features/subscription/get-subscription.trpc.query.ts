import { adminProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

export const getSubscription = adminProcedure
  .input(
    z.object({
      userId: z.string().min(1),
    }),
  )
  .query(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
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

    if (!user || !user.members.length) {
      return null;
    }

    const subscription = user.members[0].organization?.subscription;

    if (!subscription) {
      return null;
    }

    return subscription;
  });

export type GetSubscriptionOutput = inferProcedureOutput<
  typeof getSubscription
>;
