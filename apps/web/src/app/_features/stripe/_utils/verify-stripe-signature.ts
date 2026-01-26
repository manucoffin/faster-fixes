import { stripeApi } from "@/server/stripe";
import Stripe from "stripe";

export async function verifyStripeSignature(raw: string, sig: string) {
  if (!process.env.STRIPE_WEBHOOK_SIGNING_SECRET) {
    throw new Error("Missing stripe webhook signing secret");
  }

  if (!sig) {
    throw new Error("Missing stripe signature");
  }

  let event: Stripe.Event;

  try {
    event = stripeApi.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SIGNING_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);

    throw new Error(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }

  return event;
}
