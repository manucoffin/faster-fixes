"use server";

import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { LoginSchema } from "./login.schema";

export const loginMutation = publicProcedure
  .input(LoginSchema)
  .mutation(async ({ input }) => {
    try {
      const { email, password } = input;

      // Call the better-auth signIn method
      const data = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      return data.user;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle authentication errors
      if (error instanceof Error) {
        if (
          error.message.includes("Invalid") ||
          error.message.includes("password")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou mot de passe invalide",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Échec de la connexion. Veuillez réessayer.",
      });
    }
  });
