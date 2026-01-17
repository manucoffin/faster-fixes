import { SUBSCRIPTION_PLANS } from "@/server/auth/config/subscription-plans";
import { stripeApi } from "@/server/stripe";
import { stripe } from "@better-auth/stripe";

export const stripePlugin = stripe({
  stripeClient: stripeApi,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET || "",
  createCustomerOnSignUp: true,

  // Handle custom Stripe events that aren't automatically handled by Better Auth
  onEvent: async (event) => {
    if (event.type === "subscription_schedule.created") {
      // do something here (like create a subscription)
    } else if (event.type === "subscription_schedule.released") {
      // do something
    }
  },

  subscription: {
    enabled: true,

    plans: SUBSCRIPTION_PLANS,
  },
});
