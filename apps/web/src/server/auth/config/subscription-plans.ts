import { PLAN_LIMITS, SubscriptionPlanName } from "@/app/_domains/subscription";
import type { StripePlan } from "@better-auth/stripe";

// The Stripe plan list stays with the Better Auth configuration: it reads price
// identifiers from the environment, which are undefined in the browser. The
// Plan vocabulary it builds on lives in the `subscription` domain.
export const SUBSCRIPTION_PLANS: StripePlan[] = [
  {
    name: SubscriptionPlanName.Pro,
    priceId: process.env.PRO_MONTHLY_PRICE_ID,
    lookupKey: "pro_monthly",
    annualDiscountPriceId: process.env.PRO_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "pro_yearly",
    limits: {
      seats: PLAN_LIMITS[SubscriptionPlanName.Pro].seats,
    },
    group: "",
  },
  {
    name: SubscriptionPlanName.Agency,
    priceId: process.env.AGENCY_MONTHLY_PRICE_ID,
    lookupKey: "agency_monthly",
    annualDiscountPriceId: process.env.AGENCY_YEARLY_PRICE_ID,
    annualDiscountLookupKey: "agency_yearly",
    limits: {
      seats: PLAN_LIMITS[SubscriptionPlanName.Agency].seats,
    },
    group: "",
  },
];
