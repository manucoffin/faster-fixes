"use client";

import { CopyButton } from "@workspace/ui/components/copy-button";
import { cn } from "@workspace/ui/lib/utils";
import { Code2, SquareDashed } from "lucide-react";
import { useState } from "react";
import {
  type ElementContext,
  formatAreaSize,
  formatElementForCopy,
} from "../../_helpers/feedback-detail";

// Deep trees run to dozens of wrappers; the last few locate the element.
const VISIBLE_COMPONENTS = 3;

type ElementContextCardProps = {
  element: ElementContext;
};

export function ElementContextCard({ element }: ElementContextCardProps) {
  const { area } = element;
  const hasContainer = !!(
    element.description ??
    element.componentPath ??
    element.sourceFile ??
    element.selector
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
        {area ? (
          <SquareDashed className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <Code2 className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{area ? "Area" : "Element"}</span>
        {area && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formatAreaSize(area)}
          </span>
        )}
        {!area && element.sourceFile && (
          <code
            className="min-w-0 truncate text-xs text-muted-foreground"
            title={element.sourceFile}
          >
            {element.sourceFile.split("/").at(-1)}
          </code>
        )}
        <CopyButton
          content={formatElementForCopy(element)}
          variant="ghost"
          size="sm"
          className="ml-auto h-7 shrink-0 text-xs"
        >
          Copy
        </CopyButton>
      </div>
      {(!area || hasContainer) && (
        <div className="flex flex-col gap-3 p-3">
          {area && (
            <span className="text-xs font-medium text-muted-foreground">
              Inside
            </span>
          )}
          {element.description && (
            <p className="text-sm">{element.description}</p>
          )}
          {element.components.length > 0 && (
            <ComponentTrail components={element.components} />
          )}
          {element.sourceFile && (
            <CopyableCode value={element.sourceFile} label="Copy source file" />
          )}
          {element.selector && (
            <CopyableCode value={element.selector} label="Copy selector" />
          )}
        </div>
      )}
    </div>
  );
}

type ComponentTrailProps = {
  components: string[];
};

function ComponentTrail({ components }: ComponentTrailProps) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = components.length - VISIBLE_COMPONENTS;
  const isCollapsed = !expanded && hiddenCount > 0;
  const shown = isCollapsed
    ? components.slice(-VISIBLE_COMPONENTS)
    : components;

  return (
    <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
          title="Show the full component tree"
        >
          +{hiddenCount}
        </button>
      )}
      {shown.map((name, i) => {
        const isLeaf = i === shown.length - 1;
        return (
          <span key={`${name}-${i}`} className="flex items-center gap-1">
            {(i > 0 || isCollapsed) && (
              <span className="text-muted-foreground/50">/</span>
            )}
            <span
              className={cn(
                isLeaf
                  ? "rounded bg-foreground/10 px-1.5 py-0.5 font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {name}
            </span>
          </span>
        );
      })}
      {expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="ml-1 text-muted-foreground underline-offset-2 hover:underline"
        >
          Collapse
        </button>
      )}
    </div>
  );
}

type CopyableCodeProps = {
  value: string;
  label: string;
};

function CopyableCode({ value, label }: CopyableCodeProps) {
  return (
    <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
      <code className="truncate" title={value}>
        {value}
      </code>
      <CopyButton
        content={value}
        variant="ghost"
        size="icon-xs"
        className="size-6 shrink-0 text-muted-foreground"
        aria-label={label}
        title={label}
      />
    </div>
  );
}
