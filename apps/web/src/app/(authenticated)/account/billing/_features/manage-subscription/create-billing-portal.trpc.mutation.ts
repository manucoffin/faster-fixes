import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { getAppUrl } from "@/utils/url/get-app-url";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { headers } from "next/headers";

export const createBillingPortal = protectedProcedure.mutation(
  async ({ input }) => {
    const activeOrganization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!activeOrganization) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas d'organisation active",
      });
    }

    const appUrl = getAppUrl();
    const returnUrl = `${appUrl}/account/billing`;

    try {
      // Call Better Auth Stripe API to create billing portal session
      const result = await auth.api.createBillingPortal({
        body: {
          referenceId: activeOrganization.id,
          returnUrl,
          customerType: "organization",
        },
        headers: await headers(),
      });

      return result;
    } catch (error) {
      console.error(error);

      throw new Error(
        "Une erreur s'est produite lors de l'accès au portail de facturation. Veuillez réessayer.",
      );
    }
  },
);

export type CreateBillingPortalOutput = inferProcedureOutput<
  typeof createBillingPortal
>;
