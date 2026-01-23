import { cn } from "@workspace/ui/lib/utils";
import * as React from "react";

interface DashboardPageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backLink?: React.ReactNode;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  backLink,
  className,
  ...props
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center",
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        {backLink && <div className="mb-2">{backLink}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
