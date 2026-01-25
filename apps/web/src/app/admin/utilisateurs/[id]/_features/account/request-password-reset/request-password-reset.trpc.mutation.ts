import { resetPasswordUrl } from "@/lib/routing";
import { auth } from "@/server/auth";
import { adminProcedure } from "@/server/trpc/trpc";
import { getAppUrl } from "@/utils/url/get-app-url";
import { TRPCError } from "@trpc/server";
import { prisma } from "@workspace/db";
import { headers } from "next/headers";
import { RequestPasswordResetSchema } from "./request-password-reset.schema";

export const requestPasswordReset = adminProcedure
  .input(RequestPasswordResetSchema)
  .mutation(async ({ input }) => {
    const { userId } = input;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            select: {
              providerId: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user has credential provider
      const hasCredentialProvider = user.accounts.some(
        (account) => account.providerId === "credential"
      );

      if (!hasCredentialProvider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not have a credential-based account",
        });
      }

      // Request password reset using better-auth API
      const response = await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${getAppUrl()}${resetPasswordUrl}`,
        },
        headers: await headers(),
      });

      if (!response) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to request password reset",
        });
      }

      return { success: true };
    } catch (error) {
      // Handle better-auth specific errors
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to request password reset",
      });
    }
  });
