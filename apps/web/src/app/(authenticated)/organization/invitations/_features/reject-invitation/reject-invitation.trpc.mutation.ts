"use server";

import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { RejectInvitationSchema } from "./reject-invitation.schema";

export const rejectInvitation = protectedProcedure
  .input(RejectInvitationSchema)
  .mutation(async ({ input, ctx }) => {
    const { headers } = ctx;

    try {
      await auth.api.rejectInvitation({
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
        message: "Error rejecting invitation.",
      });
    }
  });

export type RejectInvitationOutput = inferProcedureOutput<
  typeof rejectInvitation
>;
