import { loginUrl } from "@/app/_constants/routes";
import { hasCompletedOnboarding } from "@/app/_domains/user/_services/has-completed-onboarding";
import { auth } from "@/server/auth";
import { LayoutParams } from "@/types/next";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Setup",
  robots: { index: false, follow: false },
};

export default async function OnboardingLayout({ children }: LayoutParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(loginUrl);
  }

  if (await hasCompletedOnboarding(session.user.id)) {
    redirect("/inbox");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
