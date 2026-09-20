import { getUserDisplayName } from "@/app/_domains/user/_helpers/get-user-display-name";
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { EmailInformation } from "./email/email-information.client";
import { getUserInformation } from "@/app/admin/users/_services/get-user-information";

type UserInformationCardProps = {
  userId: string;
};

export async function UserInformationCard({
  userId,
}: UserInformationCardProps) {
  const user = await getUserInformation({ userId });

  if (!user) {
    return null;
  }

  const username = getUserDisplayName(user);

  return (
    <Card className="">
      <CardHeader>
        <p className="text-sm text-muted-foreground">Informations</p>
        <CardTitle>{username}</CardTitle>
        <EmailInformation userId={userId} />
      </CardHeader>
      {/* <CardContent className="grid grid-cols-2 items-end">

      </CardContent> */}
    </Card>
  );
}
