import { auth } from "@/server/auth";
import { LayoutParams } from "@/types/next";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

export default async function AuthenticatedLayout({ children }: LayoutParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    unauthorized()
  }

  return <div>
    {children}
  </div>
}