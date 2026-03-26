"use client";

import type { FeatureGate } from "@/server/auth/config/subscription-plans";
import type { ReactNode } from "react";
import { DefaultFeaturePrompt } from "./upgrade-prompt.client";
import { usePlanGate } from "./use-plan-gate";

interface UpgradeGateProps {
  feature: FeatureGate;
  children: ReactNode;
  fallback?: ReactNode;
}

export function UpgradeGate({ feature, children, fallback }: UpgradeGateProps) {
  const { canAccess } = usePlanGate();

  if (!canAccess(feature)) {
    return fallback ?? <DefaultFeaturePrompt feature={feature} />;
  }

  return children;
}
