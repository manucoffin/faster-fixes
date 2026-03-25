import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { stripeApi } from "@/server/stripe";
import { stripe } from "@better-auth/stripe";
import { prisma } from "@workspace/db";

if (process.env.NODE_ENV === "production" && !process.env.STRIPE_WEBHOOK_SIGNING_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SIGNING_SECRET is required in production");
}

export const stripePlugin = stripe({
  stripeClient: stripeApi,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET ?? "",
  createCustomerOnSignUp: true,
  organization: {
    enabled: true,
    getCustomerCreateParams: async (organization) => {
      const owner = await prisma.member.findFirst({
        where: { organizationId: organization.id, role: "owner" },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Set the organization's billing email to the owner's email
      return {
        email: owner?.user.email,
      };
    },
  },

  subscription: {
    enabled: true,
    onSubscriptionComplete: async ({ subscription, stripeSubscription }) => {
      // Handle new subscriptions: ensure organizationId and stripeCustomerId are set
      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          organizationId: subscription.referenceId,
          stripeCustomerId: stripeSubscription.customer as string,
        },
      });
    },
    authorizeReference: async ({ user, referenceId, action }) => {
      // Check if the user has permission to manage subscriptions for this reference
      if (
        action === "upgrade-subscription" ||
        action === "cancel-subscription" ||
        action === "restore-subscription"
      ) {
        const org = await prisma.member.findFirst({
          where: {
            organizationId: referenceId,
            userId: user.id,
          },
        });

        return org?.role === "owner";
      }

      // For other actions, authorize
      return true;
    },
    plans: SUBSCRIPTION_PLANS,
    getCheckoutSessionParams: async ({ plan }) => ({
      params: {
        allow_promotion_codes: true,
        subscription_data: {
          default_tax_rates: [process.env.STRIPE_DEFAULT_TAX_RATE_ID!],
          ...(plan.freeTrial?.days && {
            trial_period_days: plan.freeTrial.days,
          }),
        },
      },
    }),
  },
});
