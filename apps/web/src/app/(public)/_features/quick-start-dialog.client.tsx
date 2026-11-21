"use client";

import {
  buildQuickStartPrompt,
  findQuickStartFramework,
  quickStartFrameworks,
} from "@/app/(public)/_helpers/build-quick-start-prompt";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { AngularIcon } from "@workspace/ui/components/icons/angular-icon";
import { JavascriptIcon } from "@workspace/ui/components/icons/javascript-icon";
import { ReactIcon } from "@workspace/ui/components/icons/react-icon";
import { SvelteIcon } from "@workspace/ui/components/icons/svelte-icon";
import { VueIcon } from "@workspace/ui/components/icons/vue-icon";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { ArrowRightIcon, CodeIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { type ComponentType, useState } from "react";

const frameworkIcons: Record<string, ComponentType<{ className?: string }>> = {
  react: ReactIcon,
  vue: VueIcon,
  angular: AngularIcon,
  svelte: SvelteIcon,
  javascript: JavascriptIcon,
  script: CodeIcon,
};

type ChoiceOption = {
  value: string;
  label: string;
};

type ChoiceGroupProps = {
  name: string;
  legend: string;
  options: ChoiceOption[];
  value: string;
  onValueChange: (value: string) => void;
};

function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onValueChange,
}: ChoiceGroupProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {legend}
      </legend>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {options.map((option) => {
          const id = `quick-start-${name}-${option.value}`;
          const Icon = frameworkIcons[option.value];

          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-accent/50 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10"
            >
              {name === "framework" && Icon && (
                <Icon className="size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              <RadioGroupItem id={id} value={option.value} />
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

export function QuickStartDialog() {
  const [frameworkValue, setFrameworkValue] = useState("react");
  const framework = findQuickStartFramework(frameworkValue);
  const projects = framework.projects ?? [];
  const [projectValue, setProjectValue] = useState(projects[0]?.value);
  const prompt = buildQuickStartPrompt({ framework, projectValue });

  const selectFramework = (value: string) => {
    setFrameworkValue(value);
    setProjectValue(findQuickStartFramework(value).projects?.[0]?.value);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Quick start</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick start</DialogTitle>
          <DialogDescription>
            Pick your framework and project, then paste this prompt into your
            coding agent. It installs the widget for you.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 flex min-h-0 flex-col gap-6 overflow-y-auto px-6">
          <ChoiceGroup
            name="framework"
            legend="Framework"
            options={quickStartFrameworks}
            value={framework.value}
            onValueChange={selectFramework}
          />

          {projects.length > 0 && projectValue && (
            <ChoiceGroup
              name="project"
              legend="Project"
              options={projects}
              value={projectValue}
              onValueChange={setProjectValue}
            />
          )}

          <pre className="max-h-72 min-h-40 overflow-y-auto rounded-md border bg-muted/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {prompt}
          </pre>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <DialogClose asChild>
            <Link
              href={framework.guidePath as Route}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Read the install guide
              <ArrowRightIcon className="size-4" />
            </Link>
          </DialogClose>
          <div className="flex w-full gap-2 sm:w-auto">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 sm:flex-none">
                Close
              </Button>
            </DialogClose>
            <CopyButton content={prompt} className="flex-1 sm:flex-none">
              Copy prompt
            </CopyButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
