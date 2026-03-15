import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./_features/signup-form/signup-form.client";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your account",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
          </div>

          <SignupForm />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link
              href="/connexion"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
