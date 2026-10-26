"use client";

import type { CustomMetadata } from "@fasterfixes/core";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { getCustomMetadataRows } from "../../_helpers/feedback-detail";

type CustomMetadataSectionProps = {
  customMetadata: CustomMetadata | null;
};

export function CustomMetadataSection({
  customMetadata,
}: CustomMetadataSectionProps) {
  const rows = getCustomMetadataRows(customMetadata);
  if (rows.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">
        Custom metadata
      </h4>
      <dl className="flex min-w-0 flex-col gap-0.5">
        {rows.map(({ key, value }) => (
          <div key={key} className="flex min-w-0 items-center gap-2 text-sm">
            <dt
              className="max-w-[45%] shrink-0 truncate text-muted-foreground"
              title={key}
            >
              {key}
            </dt>
            <dd
              className="min-w-0 flex-1 truncate font-mono text-xs"
              title={value}
            >
              {value}
            </dd>
            <CopyButton
              content={value}
              variant="ghost"
              size="icon-xs"
              className="size-6 shrink-0 text-muted-foreground"
              aria-label={`Copy ${key}`}
              title={`Copy ${key}`}
            />
          </div>
        ))}
      </dl>
    </div>
  );
}
