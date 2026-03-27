"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@workspace/ui/lib/utils";
import { Check } from "lucide-react";
import * as React from "react";
import { InstallSnippetStep } from "./install-snippet-step.client";
import { NextStepsStep } from "./next-steps-step.client";
import { ProjectNameStep } from "./project-name-step.client";
import { WebsiteUrlStep } from "./website-url-step.client";

const STEPPER_LABELS = ["Project", "Website", "Install"] as const;

function StepIndicator({
  step,
  currentStep,
}: {
  step: number;
  currentStep: number;
}) {
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

function StepConnector({ completed }: { completed: boolean }) {
  return (
    <div
      className={cn(
        "h-px flex-1 transition-colors",
        completed ? "bg-primary" : "bg-border",
      )}
    />
  );
}

export function OnboardingWizard() {
  const trpc = useTRPC();

  const [currentStep, setCurrentStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const createProject = useMutation(
    trpc.onboarding.createProject.mutationOptions({
      onSuccess: (result) => {
        if (result.rawApiKey) {
          setApiKey(result.rawApiKey);
          setCurrentStep(2);
        } else {
          // Refresh scenario: project existed, API key no longer available — skip to next steps
          setCurrentStep(3);
        }
      },
      onError: (err) => {
        setError(err.message || "Something went wrong. Please try again.");
      },
    }),
  );

  const completeOnboarding = useMutation(
    trpc.onboarding.complete.mutationOptions({
      onSuccess: () => {
        window.location.href = "/inbox";
      },
    }),
  );

  const handleCreateProject = () => {
    setError(null);
    createProject.mutate({ name: name.trim(), url: url.trim() });
  };

  const handleFinish = () => {
    completeOnboarding.mutate();
  };

  return (
    <div className="flex flex-col gap-8">
      {currentStep < 3 && (
        <div className="flex items-center gap-3">
          {STEPPER_LABELS.map((_, i) => (
            <React.Fragment key={i}>
              <StepIndicator step={i} currentStep={currentStep} />
              {i < STEPPER_LABELS.length - 1 && (
                <StepConnector completed={currentStep > i} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="bg-card rounded-xl border p-6">
        {currentStep === 0 && (
          <ProjectNameStep
            name={name}
            onNameChange={setName}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && (
          <WebsiteUrlStep
            url={url}
            onUrlChange={setUrl}
            onBack={() => setCurrentStep(0)}
            onNext={handleCreateProject}
            isPending={createProject.isPending}
            error={error}
          />
        )}

        {currentStep === 2 && apiKey && (
          <InstallSnippetStep apiKey={apiKey} onNext={() => setCurrentStep(3)} />
        )}

        {currentStep === 3 && <NextStepsStep onFinish={handleFinish} />}
      </div>
    </div>
  );
}
