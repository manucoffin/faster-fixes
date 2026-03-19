"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { DeleteOrganizationSection } from "./delete-organization-section.client";
import { OrganizationLogoUpload } from "./organization-logo-upload.client";
import { UpdateOrganizationForm } from "./update-organization-form.client";

export function OrganizationGeneralTab() {
  return (
    <div className="flex flex-col gap-12">
      <DashboardSection
        title="Logo"
        description="Change your organization logo"
        cardTitle="Organization logo"
        cardClassName="lg:max-w-md"
      >
        <OrganizationLogoUpload />
      </DashboardSection>

      <DashboardSection
        title="General information"
        description="Update your organization name"
        cardTitle="Organization information"
        cardClassName="lg:max-w-md"
      >
        <UpdateOrganizationForm />
      </DashboardSection>

      <DashboardSection
        title="Delete organization"
        description="Permanently delete this organization and all its data"
        cardTitle="Danger zone"
        cardClassName="lg:max-w-md"
      >
        <DeleteOrganizationSection />
      </DashboardSection>
    </div>
  );
}
