"use client";

import type { LimitableResource } from "@/server/auth/config/subscription-plans";
import type { ReactNode } from "react";
import { DefaultResourceLimitPrompt } from "./upgrade-prompt.client";
import { usePlanGate } from "./use-plan-gate";

interface ResourceGateProps {
  resource: LimitableResource;
  currentCount: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ResourceGate({
  resource,
  currentCount,
  children,
  fallback,
}: ResourceGateProps) {
  const { limits } = usePlanGate();
  const limit = limits[resource] as number;

  if (limit !== Infinity && currentCount >= limit) {
    return fallback ?? (
      <DefaultResourceLimitPrompt resource={resource} limit={limit} />
    );
  }

  return children;
}
