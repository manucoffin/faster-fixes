import { stripeApi } from "@/server/stripe";
import { protectedProcedure } from "@/server/trpc/trpc";
import { tryCatch } from "@/utils/error/try-catch";
import { TRPCError } from "@trpc/server";

export const getPastInvoices = protectedProcedure.query(async ({ ctx }) => {
  try {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return {
        invoices: [],
        status: "no_stripe_customer",
      };
    }

    const { error, data: invoices } = await tryCatch(
      stripeApi.invoices.list({
        customer: user.stripeCustomerId,
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
