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
  priceTTC: number;
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
  priceTTC,
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
          ? "border-primary border-2 shadow-xl"
          : "border-muted border-2"
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
          <p className="text-foreground text-start text-sm">{description}</p>
        </div>

        {/* Price */}
        <div className="mb-2 flex items-baseline gap-4">
          <div className="flex items-end gap-2">
            <span className="text-foreground text-5xl font-bold">{price}</span>
            <div className="text-foreground text-lg">
              <span className="font-bold">€ HT</span>
              <br />
              <span className="text-sm">/{isAnnual ? "an" : "mois"}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            (soit {priceTTC.toFixed(2)}€ TTC)
          </p>
        </div>

        {freeTrialDays && (
          <div className="text-muted-foreground mb-6 flex items-center gap-2">
            <Gift className="size-4" /> {freeTrialDays} jours offerts sans
            engagement
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
