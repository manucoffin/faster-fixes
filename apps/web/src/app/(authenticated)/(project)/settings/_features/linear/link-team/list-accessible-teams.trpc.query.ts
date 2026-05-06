"use server";

import { auth } from "@/server/auth";
import { decryptToken } from "@/server/linear/crypto";
import { getLinearClient } from "@/server/linear/linear-client";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { headers } from "next/headers";

export const listAccessibleLinearTeams = protectedProcedure.query(
  async ({ ctx }) => {
    const { prisma, session } = ctx;

    const activeOrganization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!activeOrganization) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization.",
      });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: activeOrganization.id,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only owners and admins can list teams.",
      });
    }

    const installation = await prisma.linearInstallation.findUnique({
      where: { organizationId: activeOrganization.id },
      select: { accessToken: true },
    });

    if (!installation) return [];

    const client = getLinearClient(decryptToken(installation.accessToken));
    const teams = await client.teams();
    return teams.nodes.map((t) => ({
      id: t.id,
      key: t.key,
      name: t.name,
    }));
  },
);

export type ListAccessibleLinearTeamsOutput = inferProcedureOutput<
  typeof listAccessibleLinearTeams
>;
