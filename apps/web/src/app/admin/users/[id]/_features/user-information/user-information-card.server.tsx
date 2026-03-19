import { getUserDisplayName } from "@/app/_features/user/_utils/get-user-display-name";
import {
  Card,
  CardHeader,
  CardTitle
} from "@workspace/ui/components/card";
import { EmailInformation } from "./email/email-information.client";
import { getUserInformation } from "./get-user-information.server.query";

interface UserInformationCardProps {
  userId: string;
}

export async function UserInformationCard({
  userId,
}: UserInformationCardProps) {
  const user = await getUserInformation(userId);

  if (!user) {
    return null;
  }

  const username = getUserDisplayName(user);

  return (
    <Card className="">
      <CardHeader>
        <p className="text-muted-foreground text-sm">Informations</p>
        <CardTitle>{username}</CardTitle>
        <EmailInformation userId={userId} />
      </CardHeader>
      {/* <CardContent className="grid grid-cols-2 items-end">

      </CardContent> */}
    </Card>
  );
}
