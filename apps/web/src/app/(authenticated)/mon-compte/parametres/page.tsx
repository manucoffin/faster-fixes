import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { DashboardSection } from "@/app/_features/dashboard/dashboard-section";
import { ProfileForm } from "./_features/profile/profile-form.client";

export default async function ParametersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const firstName = session?.user?.firstName ?? null;
  const lastName = session?.user?.lastName ?? null;

  return (
    <DashboardSection
      title="Profil Utilisateur"
      description="Mettez à jour vos informations personnelles"
      cardTitle="Informations Personnelles"
    >
      <ProfileForm
        initialFirstName={firstName}
        initialLastName={lastName}
      />
    </DashboardSection>
  );
}