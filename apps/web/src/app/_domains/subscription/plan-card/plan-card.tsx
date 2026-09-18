import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Check, Gift } from "lucide-react";
import * as React from "react";

interface PlanFeature {
  id: string;
  label: string;
  highlighted?: boolean;
}

interface PlanCardProps {
  title: string;
  description: string;
  price: number;
  badge?: string;
  freeTrialDays?: number;
  features: PlanFeature[];
  children: React.ReactNode;
  variant?: "default" | "highlighted";
  isAnnual?: boolean;
}

export function PlanCard({
  title,
  description,
  price,
  badge,
  freeTrialDays,
  features,
  children,
  variant = "default",
  isAnnual = false,
}: PlanCardProps) {
  const isHighlighted = variant === "highlighted";

  return (
    <Card
      className={`w-full ${
        isHighlighted
          ? "border-2 border-primary shadow-xl"
          : "border-2 border-muted"
      }`}
    >
      <CardContent className="flex h-full flex-col">
        {/* Title and Badge */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-3xl font-bold capitalize">{title}</h3>
            {badge && (
              <Badge variant="default" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-start text-sm text-foreground">{description}</p>
        </div>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-foreground">{price}</span>
            <div className="text-lg text-foreground">
              <span className="font-bold">$</span>
              <br />
              <span className="text-sm">/{isAnnual ? "year" : "month"}</span>
            </div>
          </div>
        </div>

        {freeTrialDays && (
          <div className="mb-6 flex items-center gap-2 text-muted-foreground">
            <Gift className="size-4" /> {freeTrialDays}-day free trial, no
            commitment
          </div>
        )}

        {/* Button */}
        <div className="mb-6 w-full">{children}</div>

        {/* Features */}
        <div className="flex h-full flex-col justify-between gap-4">
          <div className="space-y-3 text-left">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-start gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                <span
                  className={`text-sm ${
                    feature.highlighted
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
