import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Check, Gift } from "lucide-react";
import * as React from "react";

type PricingFeature = {
  id: string;
  label: string;
  highlighted?: boolean;
};

type PricingCardProps = {
  title: string;
  description: string;
  price: number;
  badge?: string;
  freeTrialDays?: number;
  features: PricingFeature[];
  children: React.ReactNode;
  variant?: "default" | "highlighted";
};

export function PricingCard({
  title,
  description,
  price,
  badge,
  freeTrialDays,
  features,
  children,
  variant = "default",
}: PricingCardProps) {
  const isHighlighted = variant === "highlighted";

  return (
    <Card
      className={`relative w-full ${
        isHighlighted
          ? "border-primary border-2 shadow-xl"
          : "border-muted border-2"
      }`}
    >
      {badge && (
        <div className="absolute inset-x-0 -top-3 flex justify-center">
          <Badge variant="default" className="text-xs">
            {badge}
          </Badge>
        </div>
      )}
      <CardContent className="flex h-full flex-col">
        <div className="mb-6">
          <div className="mb-2">
            <h3 className="text-3xl font-bold capitalize">{title}</h3>
          </div>
          <p className="text-foreground text-start text-sm">{description}</p>
        </div>

        <div className="mb-2 flex items-baseline gap-1">
          <span className="text-foreground text-5xl font-bold">
            ${price}
          </span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>

        {freeTrialDays && (
          <div className="text-muted-foreground mb-6 flex items-center gap-2">
            <Gift className="size-4" /> {freeTrialDays}-day free trial, no
            commitment
          </div>
        )}

        <div className="mb-6 mt-4 w-full">{children}</div>

        <div className="flex h-full flex-col justify-between gap-4">
          <div className="flex flex-col gap-3 text-left">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-start gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                <span
                  className={`text-sm ${
                    feature.highlighted
                      ? "text-foreground font-semibold"
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
