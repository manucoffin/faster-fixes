import { getUserAccount } from "@/app/admin/users/_services/get-user-account";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { DeleteUserButton } from "./delete-user/delete-user-button.client";
import { ImpersonateUserButton } from "./impersonate-user/impersonate-user-button.client";
import { RequestPasswordResetButton } from "./request-password-reset/request-password-reset-button.client";
import { RevokeUserSessionsButton } from "./revoke-user-sessions/revoke-user-sessions-button.client";

type AccountCardProps = {
  userId: string;
};

export async function AccountCard({ userId }: AccountCardProps) {
  const { email, hasCredentialProvider } = await getUserAccount({ userId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compte utilisateur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <ImpersonateUserButton userId={userId} userEmail={email ?? ""} />
          {hasCredentialProvider && (
            <RequestPasswordResetButton userId={userId} />
          )}
          <RevokeUserSessionsButton userId={userId} />
          <DeleteUserButton userId={userId} />
        </div>
      </CardContent>
    </Card>
  );
}
