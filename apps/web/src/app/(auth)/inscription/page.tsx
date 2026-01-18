import { PageParams } from "@/types/next";
import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./_features/signup-form/signup-form.client";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your account and start training",
};

export default function SignupPage({}: PageParams) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Join us and start tracking your training
            </p>
          </div>

          <SignupForm />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
