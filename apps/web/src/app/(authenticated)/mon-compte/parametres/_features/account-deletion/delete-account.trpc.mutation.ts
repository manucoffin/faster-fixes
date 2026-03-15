"use server";

import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { DeleteAccountSchema } from "./delete-account.schema";

export const deleteAccount = protectedProcedure
  .input(DeleteAccountSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      const { password } = input;

      const result = await auth.api.deleteUser({
        body: {
          password,
        },
        headers: ctx.headers,
      });

      return { success: true };
    } catch (error) {
      // Handle Better Auth API errors
      if (error instanceof Error) {
        if (
          error.message.includes("Invalid") ||
          error.message.includes("incorrect") ||
          error.message.includes("password")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Password is incorrect.",
          });
        }

        if (
          error.message.includes("session") ||
          error.message.includes("Session")
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Your session has expired. Please sign in again.",
          });
        }

        if (
          error.message.includes("OAuth") ||
          error.message.includes("provider")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please contact support to delete your account.",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while deleting the account",
      });
    }
  });

export type DeleteAccountOutput = inferProcedureOutput<typeof deleteAccount>;
