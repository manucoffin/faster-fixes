import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { PageParams } from "@/types/next";
import { prisma } from "@workspace/db/index";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountCardLoading } from "./_features/account/account-card-loading.server";
import { AccountCard } from "./_features/account/account-card.server";
import { SubscriptionCardLoading } from "./_features/subscription/subscription-card-loading.server";
import { SubscriptionCard } from "./_features/subscription/subscription-card.client";
import { UserInformationCardLoading } from "./_features/user-information/user-information-card-loading.server";
import { UserInformationCard } from "./_features/user-information/user-information-card.server";

export default async function AdminUserDetailsPage(props: PageParams) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
    },
  });

  const pageTitle = user ? `Détails de ${user.name}` : "Utilisateur";

  return (
    <DashboardPageContent
      title={pageTitle}
      breadcrumbs={[
        { label: "Tableau de bord", link: "/admin" },
        { label: "Utilisateurs", link: "/admin/utilisateurs" },
        { label: pageTitle, },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Suspense fallback={<UserInformationCardLoading />}>
            <UserInformationCard userId={id} />
          </Suspense>

          <Suspense fallback={<SubscriptionCardLoading />}>
            <SubscriptionCard userId={id} />
          </Suspense>

          <Suspense fallback={<AccountCardLoading />}>
            <AccountCard userId={id} />
          </Suspense>
        </div>

        <div className="col-span-1 lg:col-span-2">

        </div>
      </div>
    </DashboardPageContent>
  );
}