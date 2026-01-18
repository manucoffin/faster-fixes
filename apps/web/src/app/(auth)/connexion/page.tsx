import { PageParams } from "@/types/next";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./_features/login-form/login-form.client.js";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account and start training",
};

export default function LoginPage({ }: PageParams) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back to your training dashboard
            </p>
          </div>

          <LoginForm />

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
