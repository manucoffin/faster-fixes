import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { PageParams } from "@/types/next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountCardLoading } from "./_features/account/account-card-loading.server";
import { AccountCard } from "./_features/account/account-card.server";
import { SubscriptionCardLoading } from "./_features/subscription/subscription-card-loading.server";
import { SubscriptionCard } from "./_features/subscription/subscription-card.client";
import { UserInformationCardLoading } from "./_features/user-information/user-information-card-loading.server";
import { UserInformationCard } from "./_features/user-information/user-information-card.server";
import { findUserName } from "../_services/find-user-name";

export default async function AdminUserDetailsPage(props: PageParams) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return notFound();
  }

  const userName = await findUserName({ userId: id });

  const pageTitle = userName ? `${userName} details` : "User";

  return (
    <DashboardPageContent
      title={pageTitle}
      breadcrumbs={[
        { label: "Dashboard", link: "/admin" },
        { label: "Users", link: "/admin/users" },
        { label: pageTitle },
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

        <div className="col-span-1 lg:col-span-2"></div>
      </div>
    </DashboardPageContent>
  );
}
