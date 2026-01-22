import { auth } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { headers } from "next/headers";
import { ProfileForm } from "./_features/profile-form";

export default async function ParametersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const firstName = session?.user?.firstName ?? null;
  const lastName = session?.user?.lastName ?? null;

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Left Column - Section Info */}
      <div className="col-span-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil Utilisateur</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mettez à jour vos informations personnelles
          </p>
        </div>
      </div>

      {/* Right Columns - Form Card */}
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialFirstName={firstName}
              initialLastName={lastName}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}