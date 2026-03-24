"use server";

import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { headers } from "next/headers";

export const getGitHubInstallation = protectedProcedure.query(
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
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const installation = await prisma.gitHubInstallation.findFirst({
      where: { organizationId: activeOrganization.id },
      include: {
        installedBy: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!installation) return null;

    return {
      id: installation.id,
      installationId: installation.installationId,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      accountAvatarUrl: installation.accountAvatarUrl,
      installedByName: installation.installedBy.user.name,
      createdAt: installation.createdAt,
    };
  },
);

export type GetGitHubInstallationOutput = inferProcedureOutput<typeof getGitHubInstallation>;
