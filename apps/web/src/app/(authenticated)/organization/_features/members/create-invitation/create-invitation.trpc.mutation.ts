"use server";

import { auth } from "@/server/auth";
import { enforceLimit } from "@/server/trpc/middlewares/enforce-limit";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { CreateInvitationSchema } from "./create-invitation.schema";

export const createInvitation = planAwareProcedure
  .use(enforceLimit("seats"))
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
          "You do not have permission to invite members.",
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
        message: "Error sending invitation.",
      });
    }
  });

export type CreateInvitationOutput = inferProcedureOutput<
  typeof createInvitation
>;
