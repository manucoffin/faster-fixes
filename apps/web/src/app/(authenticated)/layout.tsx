import { loginUrl, onboardingUrl } from "@/app/_constants/routes";
import { ActiveProjectProvider } from "@/app/_domains/project/active-project/active-project-provider.client";
import { hasCompletedOnboarding } from "@/app/_domains/user/_services/has-completed-onboarding";
import { auth } from "@/server/auth";
import { isCloud } from "@/utils/environment/env";
import type { LayoutParams } from "@/types/next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BreadcrumbProvider } from "../_components/dashboard/breadcrumb-provider.client";
import { Breadcrumbs } from "../_components/dashboard/breadcrumbs.client";
import { ThemeToggle } from "../_components/theme-toggle.client";
import { FeedbackButton } from "./_features/feedback/feedback-button.client";
import { HeaderProjectSwitcher } from "./_features/header/header-project-switcher.client";
import { AuthenticatedSidebar } from "./_features/sidebar/authenticated-sidebar.server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthenticatedLayout({ children }: LayoutParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(loginUrl);
  }

  if (!(await hasCompletedOnboarding(session.user.id))) {
    redirect(onboardingUrl);
  }

  return (
    <SidebarProvider>
      <ActiveProjectProvider>
        <BreadcrumbProvider>
          <AuthenticatedSidebar />

          <SidebarInset>
            <header className="flex h-12 shrink-0 items-center justify-between gap-2">
              <div className="flex w-full items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="-ml-1" />

                  <HeaderProjectSwitcher />
                  <div className="hidden md:block">
                    <Breadcrumbs />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCloud() && <FeedbackButton />}
                  <ThemeToggle variant="ghost" size="icon-sm" />
                </div>
              </div>
            </header>

            <main className="p-4">{children}</main>
          </SidebarInset>
        </BreadcrumbProvider>
      </ActiveProjectProvider>
    </SidebarProvider>
  );
}
