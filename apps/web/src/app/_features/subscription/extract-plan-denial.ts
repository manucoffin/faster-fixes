import type { PlanDenial } from "@/server/subscription/denial";

/**
 * Extracts a structured PlanDenial from a tRPC error, if present.
 * The denial is attached as `cause` on the TRPCError server-side.
 *
 * tRPC serializes the cause into `error.data` — check both shapes
 * to handle different tRPC versions / serialization paths.
 */
export function extractPlanDenial(error: {
  data?: { cause?: unknown };
  cause?: unknown;
}): PlanDenial | null {
  const cause = error.data?.cause ?? error.cause;
  if (!cause || typeof cause !== "object" || !("reason" in cause)) return null;
  return cause as PlanDenial;
}
