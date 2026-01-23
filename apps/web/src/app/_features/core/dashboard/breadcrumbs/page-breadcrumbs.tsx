"use client";

import { BreadcrumbItem, useSetBreadcrumbs } from "./breadcrumb-provider";


type PageBreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  // This component doesn't render anything visible,
  // it just sets the breadcrumbs in the context
  useSetBreadcrumbs(items);

  return null;
}
