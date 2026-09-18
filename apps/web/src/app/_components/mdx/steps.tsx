import { cn } from "@workspace/ui/lib/utils";
import { Children, type ReactNode } from "react";

type StepsProps = {
  children: ReactNode;
};

type StepProps = {
  title: string;
  children: ReactNode;
};

export function Steps({ children }: StepsProps) {
  const items = Children.toArray(children);

  return (
    <div className="not-prose space-y-0">
      {items.map((child, index) => (
        <div key={index} className="relative flex gap-5">
          {/* Vertical line */}
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {index + 1}
            </div>
            {index < items.length - 1 && (
              <div className="w-px grow bg-border" />
            )}
          </div>
          {/* Content */}
          <div className={cn("pb-8", index === items.length - 1 && "pb-0")}>
            {child}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Step({ title, children }: StepProps) {
  return (
    <div>
      <p className="mb-1.5 text-base font-semibold text-foreground">{title}</p>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
