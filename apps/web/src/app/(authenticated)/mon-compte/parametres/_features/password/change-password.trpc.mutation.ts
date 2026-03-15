"use server";

import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { ChangePasswordSchema } from "./change-password.schema";

export const changePassword = protectedProcedure
  .input(ChangePasswordSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      const { currentPassword, newPassword } = input;

      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: ctx.headers,
      });

      return { success: true };
    } catch (error) {
      // Handle Better Auth API errors
      if (error instanceof Error) {
        if (
          error.message.includes("Invalid") ||
          error.message.includes("incorrect")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Current password is incorrect.",
          });
        }

        if (
          error.message.includes("session") ||
          error.message.includes("Session")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be signed in",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while changing password",
      });
    }
  });

export type ChangePasswordOutput = inferProcedureOutput<typeof changePassword>;
