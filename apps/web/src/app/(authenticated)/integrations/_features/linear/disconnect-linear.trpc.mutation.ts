"use server";

import { auth } from "@/server/auth";
import { decryptToken } from "@/server/linear/crypto";
import { revokeAccessToken } from "@/server/linear/linear-client";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { headers } from "next/headers";

export const disconnectLinear = protectedProcedure.mutation(async ({ ctx }) => {
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
      message: "Only owners and admins can disconnect Linear.",
    });
  }

  const installation = await prisma.linearInstallation.findUnique({
    where: { organizationId: activeOrganization.id },
    select: { accessToken: true },
  });

  // Revoke on Linear's side first so the workspace admin's "Connected apps" list
  // clears and reconnect doesn't hit Linear's "already installed" short-circuit.
  // Failing local cleanup if revoke errors would strand the user; log and proceed.
  if (installation) {
    try {
      const accessToken = decryptToken(installation.accessToken);
      await revokeAccessToken(accessToken);
    } catch (err) {
      console.warn("[linear] revoke failed during disconnect:", err);
    }
  }

  await prisma.linearInstallation.deleteMany({
    where: { organizationId: activeOrganization.id },
  });

  return { success: true };
});

export type DisconnectLinearOutput = inferProcedureOutput<
  typeof disconnectLinear
>;
