import type {
  PLAN_LIMITS,
  SubscriptionPlanName,
} from "../_helpers/subscription-plans";

export type PlanLimits = (typeof PLAN_LIMITS)[SubscriptionPlanName];

// Byte-valued limits are compared against a sum of sizes by the video quota
// check, never counted, so they are kept out of the countable resources.
export type VideoByteLimit = "videoFileSize" | "videoStorage";

export type LimitableResource = Exclude<
  {
    [K in keyof PlanLimits]: PlanLimits[K] extends number ? K : never;
  }[keyof PlanLimits],
  VideoByteLimit
>;

export type FeatureGate = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never;
}[keyof PlanLimits];
