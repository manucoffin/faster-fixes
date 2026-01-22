import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { EmailForm } from "./_features/email/email-form.client";
import { ProfileForm } from "./_features/profile/profile-form.client";

export default function ParametersPage() {
  return (
    <div className="flex flex-col gap-12">
      <DashboardSection
        title="Profil Utilisateur"
        description="Mettez à jour vos informations personnelles"
        cardTitle="Informations Personnelles"
      >
        <ProfileForm />
      </DashboardSection>

      <DashboardSection
        title="Adresse Email"
        description="Changez l'adresse email associée à votre compte"
        cardTitle="Email de connexion"
      >
        <EmailForm />
      </DashboardSection>
    </div>
  );
}