import { loginUrl } from "@/lib/routing";
import { auth } from "@/server/auth";
import { LayoutParams } from "@/types/next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "../_features/core/header/theme-toggle.client";
import { AuthenticatedSidebar } from "./_features/sidebar/authenticated-sidebar.server";

export default async function AuthenticatedLayout({ children }: LayoutParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(loginUrl);
  }


  return <SidebarProvider>
    <AuthenticatedSidebar />

    <SidebarInset>
      <header className="flex px-4 py-2 items-center justify-between">
        <SidebarTrigger />
        <ThemeToggle variant="ghost" size="icon" />
      </header>

      <main className="p-4">
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
}