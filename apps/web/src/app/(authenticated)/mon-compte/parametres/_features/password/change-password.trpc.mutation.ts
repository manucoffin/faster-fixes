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

      const result = await auth.api.changePassword({
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
            message: "Le mot de passe actuel est incorrect.",
          });
        }

        if (
          error.message.includes("session") ||
          error.message.includes("Session")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Vous devez être connecté",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Une erreur s'est produite lors du changement de mot de passe",
      });
    }
  });

export type ChangePasswordOutput = inferProcedureOutput<typeof changePassword>;
