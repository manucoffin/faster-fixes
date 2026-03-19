import { adminProcedure } from "@/server/trpc/trpc";
import { SubscriptionSchema } from "./subscription.schema";

export const createSubscription = adminProcedure
  .input(SubscriptionSchema)
  .mutation(async ({ input, ctx }) => {
    const subscription = await ctx.prisma.subscription.create({
      data: {
        plan: input.plan,
        referenceId: input.organizationId,
        organizationId: input.organizationId,
        status: input.status,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        trialStart: input.trialStart,
        trialEnd: input.trialEnd,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
      },
      select: {
        id: true,
        plan: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        cancelAtPeriodEnd: true,
        trialStart: true,
        trialEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        organizationId: true,
      },
    });

    return subscription;
  });
