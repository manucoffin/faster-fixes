import type { WidgetConfig } from "@fasterfixes/core";

// Public visitors carry no Reviewer token, and a Project can switch the Widget
// off from the dashboard: either way the page shows nothing.
export function shouldMount(
  reviewerToken: string | null,
  config: WidgetConfig | null,
): boolean {
  return Boolean(reviewerToken) && config?.enabled === true;
}
