"use client";

import { Button } from "@workspace/ui/components/button";
import { ArrowRight, Circle, PartyPopper } from "lucide-react";

type NextStepsStepProps = {
  onFinish: () => void;
};

export function NextStepsStep({ onFinish }: NextStepsStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
        <PartyPopper className="text-primary size-8" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">You&apos;re all set</h1>
        <p className="text-muted-foreground text-sm">
          Your project is ready. Here&apos;s what to do next.
        </p>
      </div>

      <ul className="text-muted-foreground flex flex-col gap-2 text-left text-sm">
        <li className="flex items-center gap-2">
          <Circle className="size-3.5 shrink-0" />
          Deploy your website with the widget installed
        </li>
        <li className="flex items-center gap-2">
          <Circle className="size-3.5 shrink-0" />
          Invite your first reviewer from the dashboard
        </li>
        <li className="flex items-center gap-2">
          <Circle className="size-3.5 shrink-0" />
          Start collecting feedback
        </li>
      </ul>

      <Button onClick={onFinish} className="w-full">
        Go to dashboard
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
