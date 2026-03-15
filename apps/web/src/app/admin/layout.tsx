import { loginUrl } from "@/lib/routing";
import { auth } from "@/server/auth";
import { LayoutParams } from "@/types/next";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BreadcrumbProvider } from "../_features/core/dashboard/breadcrumbs/breadcrumb-provider";
import { Breadcrumbs } from "../_features/core/dashboard/breadcrumbs/breadcrumbs";
import { ThemeToggle } from "../_features/core/header/theme-toggle.client";
import { AdminSidebar } from "./_features/sidebar/admin-sidebar.server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: LayoutParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(loginUrl);
  }


  return (
    <SidebarProvider>
      <BreadcrumbProvider>
        <AdminSidebar />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2">
            <div className="flex w-full items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumbs />
              </div>

              <div className="space-x-2">
                <ThemeToggle variant="ghost" size="icon" />
              </div>
            </div>
          </header>

          <main className="px-4">
            {children}
          </main>
        </SidebarInset>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}