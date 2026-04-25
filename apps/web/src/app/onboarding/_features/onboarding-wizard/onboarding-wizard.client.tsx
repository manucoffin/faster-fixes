"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { NextStepsStep } from "../complete-onboarding/next-steps-step.client";
import { ProjectNameStep } from "../create-project/project-name-step.client";
import { WebsiteUrlStep } from "../create-project/website-url-step.client";
import { InstallSnippetStep } from "./install-snippet-step.client";
import { Stepper } from "./step-indicator.client";

export function OnboardingWizard() {
  const trpc = useTRPC();

  const [currentStep, setCurrentStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
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
    createProject.mutate({ name: name.trim(), domain: domain.trim() });
  };

  const handleFinish = () => {
    completeOnboarding.mutate();
  };

  return (
    <div className="flex flex-col gap-8">
      {currentStep < 3 && <Stepper currentStep={currentStep} />}

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
            domain={domain}
            onDomainChange={setDomain}
            onBack={() => setCurrentStep(0)}
            onNext={handleCreateProject}
            isPending={createProject.isPending}
            error={error}
          />
        )}

        {currentStep === 2 && apiKey && (
          <InstallSnippetStep
            apiKey={apiKey}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && <NextStepsStep onFinish={handleFinish} />}
      </div>
    </div>
  );
}
