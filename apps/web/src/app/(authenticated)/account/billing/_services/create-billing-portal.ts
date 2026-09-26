import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors/domain-errors";
import { getAppUrl } from "@/utils/url/get-app-url";

export async function createBillingPortal({ headers }: { headers: Headers }) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  // The portal is opened for the Organization, not the User: without an active
  // one there is no Stripe customer to bill.
  if (!activeOrganization) {
    throw new ForbiddenError("You do not have an active organization");
  }

  return auth.api.createBillingPortal({
    body: {
      referenceId: activeOrganization.id,
      returnUrl: `${getAppUrl()}/account/billing`,
      customerType: "organization",
    },
    headers,
  });
}
