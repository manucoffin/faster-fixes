"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ArrowRight } from "lucide-react";

type ProjectNameStepProps = {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
};

export function ProjectNameStep({
  name,
  onNameChange,
  onNext,
}: ProjectNameStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">What&apos;s your project called?</h1>
        <p className="text-muted-foreground text-sm">
          A project represents the client website where you&apos;ll collect feedback.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="project-name" className="text-sm font-medium">
          Project name
        </label>
        <Input
          id="project-name"
          placeholder="Client Site XYZ"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onNext();
          }}
          autoFocus
        />
      </div>

      <Button
        onClick={onNext}
        disabled={!name.trim()}
        className="self-end"
      >
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
