import type { ReactNode } from "react";
import { SectionBody } from "../../features/_components/section-body";

export type VsStep = {
  label: string;
  body: string;
};

type VsStepsProps = {
  steps: VsStep[];
  illustration: ReactNode;
};

// Numbered steps beside a sticky illustration, as on the feature pages' how-it-works.
export function VsSteps({ steps, illustration }: VsStepsProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="flex gap-4 border-t py-6 first:border-t-0 first:pt-0"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-xs text-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="pt-0.5">
              <h3 className="text-lg font-medium">{step.label}</h3>
              <SectionBody className="mt-2 text-base">
                <p>{step.body}</p>
              </SectionBody>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-background p-4 sm:p-8 lg:sticky lg:top-24">
        {illustration}
      </div>
    </div>
  );
}
