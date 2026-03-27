import { loginUrl } from "@/app/_constants/routes";
import { auth } from "@/server/auth";
import { LayoutParams } from "@/types/next";
import { prisma } from "@workspace/db";
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

  // Direct DB check bypasses better-auth's 5-minute cookie cache
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (user?.onboardingCompleted) {
    redirect("/inbox");
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
