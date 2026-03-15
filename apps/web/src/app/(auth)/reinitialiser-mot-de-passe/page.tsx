import { forgotPasswordUrl, loginUrl } from "@/lib/routing";
import { PageParams } from "@/types/next";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ResetPasswordForm } from "./_features/reset-password-form/reset-password-form.client";

export default async function ResetPasswordPage(props: PageParams) {
  const searchParams = await props.searchParams;
  const { success, error, token } = searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {success === "true" ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold flex gap-2 items-center justify-center">
                <CheckCircle2 className="size-5" />
                <span>Mot de passe réinitialisé !</span>
              </h1>
              <p className="text-muted-foreground">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez
                maintenant vous connecter avec votre nouveau mot de passe.
              </p>
            </div>

            <div className="flex justify-center">
              <Button variant="default" className="" asChild>
                <Link href={loginUrl}>Se connecter</Link>
              </Button>
            </div>
          </div>
        ) : error === "INVALID_TOKEN" ? (
          <>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="size-4" />
              <AlertTitle>Lien invalide ou expiré</AlertTitle>
              <AlertDescription>
                Le lien de réinitialisation que vous avez utilisé est invalide
                ou a expiré. Veuillez demander un nouveau lien de
                réinitialisation.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={forgotPasswordUrl}>Demander un nouveau lien</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={loginUrl}>Retour à la connexion</Link>
              </Button>
            </div>
          </>
        ) : token ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">
                Réinitialiser votre mot de passe
              </h1>
              <p className="text-muted-foreground">
                Entrez votre nouveau mot de passe ci-dessous pour réinitialiser
                le mot de passe de votre compte.
              </p>
            </div>

            <ResetPasswordForm token={token as string} />
          </div>
        ) : (
          <>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="size-4" />
              <AlertTitle>Paramètre manquant</AlertTitle>
              <AlertDescription>
                Le token de réinitialisation est manquant. Veuillez utiliser le
                lien fourni dans votre email ou demander un nouveau lien.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={forgotPasswordUrl}>Demander un nouveau lien</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={loginUrl}>Retour à la connexion</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
