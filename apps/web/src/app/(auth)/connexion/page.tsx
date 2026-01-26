import { signupUrl } from "@/lib/routing";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./_features/login-form/login-form.client";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Connectez-vous à votre compte</h1>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Vous n&apos;avez pas de compte ?{" "}
            </span>
            <Link
              href={signupUrl}
              className="font-medium text-primary hover:underline"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
