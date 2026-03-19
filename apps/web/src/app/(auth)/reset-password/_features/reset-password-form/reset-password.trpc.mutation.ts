"use server";

import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
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
          message: "Missing token. Invalid reset link.",
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
            message: "The reset link is invalid or has expired.",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Password reset failed. Please try again.",
      });
    }
  });

export type ResetPasswordOutput = inferProcedureOutput<
  typeof resetPasswordMutation
>;
