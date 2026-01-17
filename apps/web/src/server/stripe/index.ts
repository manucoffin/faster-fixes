import Stripe from "stripe";

// Only throw if Stripe is actually accessed, not during module import
// This allows the Better Auth CLI to import the config without needing env vars
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripeApi = new Stripe(stripeSecretKey, {
  apiVersion: "2025-12-15.clover",
});
