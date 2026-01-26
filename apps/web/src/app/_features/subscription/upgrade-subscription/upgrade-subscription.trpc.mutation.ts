import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { getAppUrl } from "@/utils/url/get-app-url";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { z } from "zod";

export const upgradeSubscription = protectedProcedure
  .input(
    z.object({
      planName: z.string(),
      annual: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input }) => {
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

    // Call Better Auth Stripe API
    const result = await auth.api.upgradeSubscription({
      body: {
        plan: input.planName,
        referenceId: activeOrganization.id,
        annual: input.annual || false,
        successUrl: `${appUrl}/espace-pro/mon-compte/facturation?success=true`,
        cancelUrl: `${appUrl}/espace-pro/mon-compte/facturation?cancelled=true`,
        disableRedirect: true,
        returnUrl: `${appUrl}/espace-pro/mon-compte/facturation`,
      },
      headers: await headers(),
    });

    return result;
  });
