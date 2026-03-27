"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Check } from "lucide-react";

const STEPPER_LABELS = ["Project", "Website", "Install"] as const;

type StepIndicatorProps = {
  step: number;
  currentStep: number;
};

function StepIndicator({ step, currentStep }: StepIndicatorProps) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
          isCompleted && "bg-primary text-primary-foreground",
          isCurrent &&
            "bg-primary text-primary-foreground ring-primary/20 ring-4",
          !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
        )}
      >
        {isCompleted ? <Check className="size-4" /> : step + 1}
      </div>
      <span
        className={cn(
          "hidden text-sm sm:inline",
          isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
        )}
      >
        {STEPPER_LABELS[step]}
      </span>
    </div>
  );
}

type StepConnectorProps = {
  completed: boolean;
};

function StepConnector({ completed }: StepConnectorProps) {
  return (
    <div
      className={cn(
        "h-px flex-1 transition-colors",
        completed ? "bg-primary" : "bg-border",
      )}
    />
  );
}

type StepperProps = {
  currentStep: number;
};

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center gap-3">
      {STEPPER_LABELS.map((_, i) => (
        <div key={i} className="contents">
          <StepIndicator step={i} currentStep={currentStep} />
          {i < STEPPER_LABELS.length - 1 && (
            <StepConnector completed={currentStep > i} />
          )}
        </div>
      ))}
    </div>
  );
}
