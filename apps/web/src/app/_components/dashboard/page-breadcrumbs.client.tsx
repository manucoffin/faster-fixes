"use client";

import type { BreadcrumbItem } from "./breadcrumb-provider.client";
import { useSetBreadcrumbs } from "./breadcrumb-provider.client";

type PageBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  // This component doesn't render anything visible,
  // it just sets the breadcrumbs in the context
  useSetBreadcrumbs(items);

  return null;
}
