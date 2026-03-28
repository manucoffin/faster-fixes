import { loginUrl } from "@/app/_constants/routes";
import { auth } from "@/server/auth";
import { isCloud } from "@/utils/environment/env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BillingPageContent } from "./_features/billing-page-content.client";

export default async function BillingPage() {
  if (!isCloud()) {
    redirect("/inbox");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(loginUrl);
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrganization) {
    redirect(loginUrl);
  }

  return <BillingPageContent organizationId={activeOrganization.id} />;
}
