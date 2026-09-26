import type { BreadcrumbItem } from "./breadcrumb-provider.client";
import { PageBreadcrumbs } from "./page-breadcrumbs.client";
import { DashboardPageHeader } from "./dashboard-page-header";

type DashboardPageContentProps = {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
};

export function DashboardPageContent({
  title,
  actions,
  children,
  breadcrumbs,
}: DashboardPageContentProps) {
  return (
    <div className="">
      <PageBreadcrumbs items={breadcrumbs} />

      {title && <DashboardPageHeader title={title} actions={actions} />}

      {children}
    </div>
  );
}
