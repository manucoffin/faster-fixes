"use server";

import { resetPasswordUrl } from "@/lib/routing";
import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { ForgotPasswordSchema } from "./forgot-password.schema";

export const forgotPasswordMutation = publicProcedure
  .input(ForgotPasswordSchema)
  .mutation(async ({ input }) => {
    try {
      const { email } = input;
      const normalizedEmail = email.toLowerCase().trim();

      const response = await auth.api.requestPasswordReset({
        body: {
          email: normalizedEmail,
          redirectTo: resetPasswordUrl,
        },
        headers: await headers(),
      });

      return response;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle known errors
      if (error instanceof Error) {
        if (
          error.message.includes("not found") ||
          error.message.includes("does not exist")
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cet email n'existe pas dans notre système",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer.",
      });
    }
  });
