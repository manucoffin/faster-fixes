import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { stripeApi } from "@/server/stripe";
import { stripe } from "@better-auth/stripe";
import { prisma } from "@workspace/db";

export const stripePlugin = stripe({
  stripeClient: stripeApi,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET || "",
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
    getCheckoutSessionParams: async ({ user }) => {
      return {
        params: {
          // customer_email: user.email,
          // customer: user.email,
        },
      };
    },
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
  },
});
