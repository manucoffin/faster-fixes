import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./_features/signup-form/signup-form.client";

export const metadata: Metadata = {
  title: "S'inscrire",
  description: "Créer votre compte",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Créer votre compte</h1>
          </div>

          <SignupForm />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Vous avez déjà un compte?{" "}
            </span>
            <Link
              href="/connexion"
              className="font-medium text-primary hover:underline"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
