import { auth } from "@/server/auth";
import { stripeApi } from "@/server/stripe";
import { protectedProcedure } from "@/server/trpc/trpc";
import { tryCatch } from "@/utils/error/try-catch";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";

export const getPastInvoices = protectedProcedure.query(async ({ ctx }) => {
  try {
    const activeOrganization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!activeOrganization) {
      return {
        invoices: [],
        status: "no_active_organization",
      };
    }

    // Fetch the organization's stripeCustomerId from Prisma
    const organization = await ctx.prisma.organization.findUnique({
      where: {
        id: activeOrganization.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!organization?.stripeCustomerId) {
      return {
        invoices: [],
        status: "no_stripe_customer",
      };
    }

    const { error, data: invoices } = await tryCatch(
      stripeApi.invoices.list({
        customer: organization.stripeCustomerId,
        limit: 100,
        status: "paid",
      }),
    );

    if (error) {
      throw error;
    }

    return {
      invoices: invoices.data || [],
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erreur lors de la récupération des factures.",
      cause: error,
    });
  }
});
