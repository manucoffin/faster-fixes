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
        description="Changez le logo de votre organisation"
        cardTitle="Logo de l'organisation"
        cardClassName="max-w-md"
      >
        <OrganizationLogoUpload />
      </DashboardSection>

      <DashboardSection
        title="Informations générales"
        description="Mettez à jour le nom de votre organisation"
        cardTitle="Informations de l'organisation"
        cardClassName="max-w-md"
      >
        <UpdateOrganizationForm />
      </DashboardSection>

      <DashboardSection
        title="Supprimer l'organisation"
        description="Supprimez définitivement cette organisation et toutes ses données"
        cardTitle="Zone de danger"
        cardClassName="max-w-md"
      >
        <DeleteOrganizationSection />
      </DashboardSection>
    </div>
  );
}
