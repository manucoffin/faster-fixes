"use server";

import { decryptToken } from "@/server/linear/crypto";
import { getLinearClient } from "@/server/linear/linear-client";
import { getTeamStates } from "@/server/linear/resolve-team-state";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

export const listLinearTeamStates = protectedProcedure
  .input(z.object({ teamId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const member = await prisma.member.findFirst({
      where: { userId: session.user.id, role: { in: ["owner", "admin"] } },
      select: { organizationId: true },
    });

    if (!member) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const installation = await prisma.linearInstallation.findUnique({
      where: { organizationId: member.organizationId },
      select: { accessToken: true },
    });

    if (!installation) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Linear is not connected.",
      });
    }

    const client = getLinearClient(decryptToken(installation.accessToken));
    return getTeamStates(client, input.teamId);
  });

export type ListLinearTeamStatesOutput = inferProcedureOutput<
  typeof listLinearTeamStates
>;
