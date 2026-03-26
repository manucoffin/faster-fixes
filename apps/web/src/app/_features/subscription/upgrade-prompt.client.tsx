"use client";

import type {
  FeatureGate,
  LimitableResource,
} from "@/server/auth/config/subscription-plans";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
  title: string;
  description: string;
}

export function UpgradePrompt({ title, description }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/account/billing">
          Upgrade plan
          <ArrowRight className="ml-1 size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

export function DefaultResourceLimitPrompt({
  resource,
  limit,
}: {
  resource: LimitableResource;
  limit: number;
}) {
  return (
    <UpgradePrompt
      title={`${capitalize(resource)} limit reached`}
      description={`Your plan allows up to ${limit} ${resource}. Upgrade to get more.`}
    />
  );
}

export function DefaultFeaturePrompt({ feature }: { feature: FeatureGate }) {
  return (
    <UpgradePrompt
      title="Feature not available"
      description={`${formatFeatureName(feature)} is not included in your current plan.`}
    />
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatFeatureName(feature: FeatureGate): string {
  return feature
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
