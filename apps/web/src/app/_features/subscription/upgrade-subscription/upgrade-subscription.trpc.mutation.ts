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
        message: "Vous n'avez pas d'organization active",
      });
    }

    const appUrl = getAppUrl();

    // Call Better Auth Stripe API
    const result = await auth.api.upgradeSubscription({
      body: {
        plan: input.planName,
        referenceId: activeOrganization.id,
        customerType: "organization",
        annual: input.annual || false,
        successUrl: `${appUrl}/account/billing?success=true`,
        cancelUrl: `${appUrl}/account/billing?cancelled=true`,
        disableRedirect: true,
        returnUrl: `${appUrl}/account/billing`,
      },
      headers: await headers(),
    });

    return result;
  });
