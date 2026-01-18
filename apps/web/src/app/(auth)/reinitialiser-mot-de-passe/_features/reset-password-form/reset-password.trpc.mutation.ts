"use server";

import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { ResetPasswordSchema } from "./reset-password.schema";

export const resetPasswordMutation = publicProcedure
  .input(ResetPasswordSchema)
  .mutation(async ({ input }) => {
    try {
      const { token, password } = input;

      if (!token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token manquant. Lien de réinitialisation invalide.",
        });
      }

      const data = await auth.api.resetPassword({
        body: {
          newPassword: password,
          token,
        },
        headers: await headers(),
      });

      return data;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle authentication errors
      if (error instanceof Error) {
        if (
          error.message.includes("Invalid") ||
          error.message.includes("token") ||
          error.message.includes("expired")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Le lien de réinitialisation est invalide ou a expiré.",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Échec de la réinitialisation du mot de passe. Veuillez réessayer.",
      });
    }
  });
