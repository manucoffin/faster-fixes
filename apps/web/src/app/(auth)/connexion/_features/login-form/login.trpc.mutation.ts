"use server";

import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
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
        if (error.message.includes("Email not verified")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "EMAIL_NOT_VERIFIED",
          });
        }

        if (
          error.message.includes("Invalid") ||
          error.message.includes("password")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
      }

      console.error("[login] Unexpected error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Sign in failed. Please try again.",
      });
    }
  });

export type LoginOutput = inferProcedureOutput<typeof loginMutation>;
