import { auth } from "@/server/auth";
import { LayoutParams } from "@/types/next";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { AuthenticatedSidebar } from "./_features/sidebar/authenticated-sidebar.server";

export default async function AuthenticatedLayout({ children }: LayoutParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    unauthorized()
  }

  return <SidebarProvider>
    <AuthenticatedSidebar />

    <SidebarInset>


      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
}