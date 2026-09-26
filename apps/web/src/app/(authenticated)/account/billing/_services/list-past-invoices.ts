import { auth } from "@/server/auth";
import { stripeApi } from "@/server/stripe";
import { prisma } from "@workspace/db";

export async function listPastInvoices({ headers }: { headers: Headers }) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  // An Organization that was never billed has no invoice to list, which the
  // card renders as its empty state rather than as a failure.
  if (!activeOrganization) {
    return { invoices: [], status: "no_active_organization" };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: activeOrganization.id },
    select: { stripeCustomerId: true },
  });

  if (!organization?.stripeCustomerId) {
    return { invoices: [], status: "no_stripe_customer" };
  }

  const invoices = await stripeApi.invoices.list({
    customer: organization.stripeCustomerId,
    limit: 100,
    status: "paid",
  });

  return { invoices: invoices.data };
}

export type ListPastInvoicesOutput = Awaited<
  ReturnType<typeof listPastInvoices>
>;
