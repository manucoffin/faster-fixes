"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import React from "react";
import {
  type BreadcrumbItem as BreadcrumbEntry,
  useBreadcrumbs,
} from "./breadcrumb-provider.client";

type BreadcrumbLabelProps = {
  breadcrumb: BreadcrumbEntry;
  isLast: boolean;
};

function BreadcrumbLabel({ breadcrumb, isLast }: BreadcrumbLabelProps) {
  if (isLast) {
    return <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>;
  }

  if (breadcrumb.link) {
    return (
      <BreadcrumbLink href={breadcrumb.link}>{breadcrumb.label}</BreadcrumbLink>
    );
  }

  return <span>{breadcrumb.label}</span>;
}

export function Breadcrumbs() {
  const { breadcrumbs } = useBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLabel breadcrumb={breadcrumb} isLast={isLast} />
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
