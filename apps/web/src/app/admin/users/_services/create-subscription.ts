import { prisma } from "@workspace/db";
import type { CreateSubscriptionInput } from "./create-subscription.schema";

export async function createSubscription(input: CreateSubscriptionInput) {
  return await prisma.subscription.create({
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
}

export type CreateSubscriptionOutput = Awaited<
  ReturnType<typeof createSubscription>
>;
