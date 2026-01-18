import type { Metadata } from "next";
import { ForgotPasswordForm } from "./_features/forgot-password-form/forgot-password-form.client";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez votre mot de passe.",
};

export default async function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Réinitialisez votre mot de passe</h1>
            <p className="text-muted-foreground">
              Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}