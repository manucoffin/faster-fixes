import type { Metadata } from "next";
import { ForgotPasswordForm } from "./_features/forgot-password-form/forgot-password-form.client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password.",
};

export default async function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}