import { BreadcrumbItem } from "./breadcrumbs/breadcrumb-provider";
import { PageBreadcrumbs } from "./breadcrumbs/page-breadcrumbs";
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
    <div className="py-4">
      <PageBreadcrumbs items={breadcrumbs} />

      {title && <DashboardPageHeader title={title} actions={actions} />}

      {children}
    </div>
  );
}
