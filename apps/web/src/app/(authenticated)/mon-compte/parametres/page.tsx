import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Separator } from "@workspace/ui/components/separator";
import { AlertTriangleIcon } from "lucide-react";
import { AccountDeletionButton } from "./_features/account-deletion/account-deletion-button.client";
import { EmailForm } from "./_features/email/email-form.client";
import { PasswordForm } from "./_features/password/password-form.client";
import { ProfileAvatarUpload } from "./_features/profile/profile-avatar-upload.client";
import { ProfileForm } from "./_features/profile/profile-form.client";

export default function ParametersPage() {
  return (
    <DashboardPageContent
      breadcrumbs={[{ label: "Mon compte" }, { label: "Paramètres" }]}
    >
      <div className="flex flex-col gap-12">
        <DashboardSection
          title="Profil Utilisateur"
          description="Mettez à jour vos informations personnelles"
          cardTitle="Informations Personnelles"
          cardClassName="lg:max-w-md"
        >
          <div className="flex flex-col gap-6">
            <ProfileAvatarUpload />
            <Separator />
            <ProfileForm />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Adresse Email"
          description="Changez l'adresse email associée à votre compte"
          cardTitle="Email de connexion"
          cardClassName="lg:max-w-md"
        >
          <EmailForm />
        </DashboardSection>

        <DashboardSection
          title="Mot de Passe"
          description="Modifiez votre mot de passe pour sécuriser votre compte"
          cardTitle="Sécurité du compte"
          cardClassName="lg:max-w-md"
        >
          <PasswordForm />
        </DashboardSection>

        <DashboardSection
          title="Supprimer le compte"
          description="Supprimez définitivement votre compte et toutes vos données"
          cardTitle="Zone de danger"
          cardClassName="lg:max-w-md"
        >
          <div className="flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertDescription>
                Attention : la suppression de votre compte est irréversible.
                Toutes vos données seront supprimées de manière définitive et ne
                pourront pas être récupérées.
              </AlertDescription>
            </Alert>
            <AccountDeletionButton />
          </div>
        </DashboardSection>
      </div>
    </DashboardPageContent>
  );
}
