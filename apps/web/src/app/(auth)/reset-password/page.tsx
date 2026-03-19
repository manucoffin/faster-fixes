import { forgotPasswordUrl, loginUrl } from "@/app/_constants/routes";
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
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {success === "true" ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
                <CheckCircle2 className="size-5" />
                <span>Password reset!</span>
              </h1>
              <p className="text-muted-foreground">
                Your password has been reset successfully. You can now sign in
                with your new password.
              </p>
            </div>

            <div className="flex justify-center">
              <Button variant="default" className="" asChild>
                <Link href={loginUrl}>Sign in</Link>
              </Button>
            </div>
          </div>
        ) : error === "INVALID_TOKEN" ? (
          <>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="size-4" />
              <AlertTitle>Invalid or expired link</AlertTitle>
              <AlertDescription>
                The reset link you used is invalid or has expired. Please
                request a new reset link.
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
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="text-muted-foreground">
                Enter your new password below to reset your account password.
              </p>
            </div>

            <ResetPasswordForm token={token as string} />
          </div>
        ) : (
          <>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="size-4" />
              <AlertTitle>Missing parameter</AlertTitle>
              <AlertDescription>
                The reset token is missing. Please use the link provided in your
                email or request a new link.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={forgotPasswordUrl}>Request a new link</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={loginUrl}>Back to sign in</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
