import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { ProfileForm } from "./_features/profile/profile-form.client";

export default function ParametersPage() {
  return (
    <DashboardSection
      title="Profil Utilisateur"
      description="Mettez à jour vos informations personnelles"
      cardTitle="Informations Personnelles"
    >
      <ProfileForm />
    </DashboardSection>
  );
}