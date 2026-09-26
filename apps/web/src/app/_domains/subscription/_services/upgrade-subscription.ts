import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { getAppUrl } from "@/utils/url/get-app-url";

export async function upgradeSubscription({
  planName,
  annual,
  headers,
}: {
  planName: string;
  annual?: boolean;
  headers: Headers;
}) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  // The denial needs the loaded Organization, so it belongs here rather than
  // at the transport edge.
  if (!activeOrganization) {
    throw new ForbiddenError("You do not have an active organization");
  }

  const appUrl = getAppUrl();

  return auth.api.upgradeSubscription({
    body: {
      plan: planName,
      referenceId: activeOrganization.id,
      customerType: "organization",
      annual: annual ?? false,
      successUrl: `${appUrl}/account/billing?success=true`,
      cancelUrl: `${appUrl}/account/billing?cancelled=true`,
      disableRedirect: true,
      returnUrl: `${appUrl}/account/billing`,
    },
    headers,
  });
}
