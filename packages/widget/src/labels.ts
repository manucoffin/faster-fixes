import { DEFAULT_LABELS } from "@fasterfixes/core";
import type { Labels } from "@fasterfixes/core";

// A `labels` object can come from untyped script-tag code, so an override only
// replaces a default of the same kind (string for string, function for function).
export function resolveLabels(overrides: Partial<Labels> = {}): Labels {
  const labels = { ...DEFAULT_LABELS };
  for (const key of Object.keys(DEFAULT_LABELS) as (keyof Labels)[]) {
    const value: unknown = overrides[key];
    if (typeof value === typeof DEFAULT_LABELS[key]) {
      Object.assign(labels, { [key]: value });
    }
  }
  return labels;
}
