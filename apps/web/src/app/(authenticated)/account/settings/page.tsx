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
      breadcrumbs={[{ label: "My Account" }, { label: "Settings" }]}
    >
      <div className="flex flex-col gap-12">
        <DashboardSection
          title="User Profile"
          description="Update your personal information"
          cardTitle="Personal Information"
          cardClassName="lg:max-w-md"
        >
          <div className="flex flex-col gap-6">
            <ProfileAvatarUpload />
            <Separator />
            <ProfileForm />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Email Address"
          description="Change the email address associated with your account"
          cardTitle="Sign-in email"
          cardClassName="lg:max-w-md"
        >
          <EmailForm />
        </DashboardSection>

        <DashboardSection
          title="Password"
          description="Change your password to secure your account"
          cardTitle="Account security"
          cardClassName="lg:max-w-md"
        >
          <PasswordForm />
        </DashboardSection>

        <DashboardSection
          title="Delete account"
          description="Permanently delete your account and all your data"
          cardTitle="Danger zone"
          cardClassName="lg:max-w-md"
        >
          <div className="flex flex-col gap-4">
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertDescription>
                Warning: deleting your account is irreversible. All your data
                will be permanently deleted and cannot be recovered.
              </AlertDescription>
            </Alert>
            <AccountDeletionButton />
          </div>
        </DashboardSection>
      </div>
    </DashboardPageContent>
  );
}
