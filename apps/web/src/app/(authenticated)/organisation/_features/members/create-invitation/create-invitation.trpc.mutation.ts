"use server";

import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { CreateInvitationSchema } from "./create-invitation.schema";

export const createInvitation = protectedProcedure
  .input(CreateInvitationSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session, headers } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Vous n'avez pas les permissions pour inviter des membres.",
      });
    }

    try {
      const invitation = await auth.api.createInvitation({
        body: {
          email: input.email,
          role: input.role,
          organizationId: input.organizationId,
        },
        headers,
      });

      return invitation;
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de l'envoi de l'invitation.",
      });
    }
  });

export type CreateInvitationOutput = inferProcedureOutput<
  typeof createInvitation
>;
