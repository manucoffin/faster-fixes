"use server";

import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { SignupSchema } from "./signup.schema";

export const signupMutation = publicProcedure
  .input(SignupSchema)
  .mutation(async ({ input }) => {
    try {
      const { email, password } = input;

      // Call the better-auth signup method
      const name = email.split("@")[0] || email;
      const data = await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        },
      });

      if (!data) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Échec de la création du compte",
        });
      }

      return data.user;
    } catch (error) {
      console.error(error);

      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle duplicate email
      if (error instanceof Error && error.message.includes("email")) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email déjà enregistré",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Échec de la création du compte. Veuillez réessayer.",
      });
    }
  });
