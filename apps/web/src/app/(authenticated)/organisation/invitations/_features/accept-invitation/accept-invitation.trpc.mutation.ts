"use server";

import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { AcceptInvitationSchema } from "./accept-invitation.schema";

export const acceptInvitation = protectedProcedure
  .input(AcceptInvitationSchema)
  .mutation(async ({ input, ctx }) => {
    const { headers } = ctx;

    try {
      await auth.api.acceptInvitation({
        body: { invitationId: input.invitationId },
        headers,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de l'acceptation de l'invitation.",
      });
    }
  });

export type AcceptInvitationOutput = inferProcedureOutput<
  typeof acceptInvitation
>;
