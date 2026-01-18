"use server";

import { defaultRedirect } from "@/lib/routing";
import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";
import { LoginSchema } from "./login.schema.js";

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

      if (!data) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
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
            message: "Invalid email or password",
          });
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sign in. Please try again.",
      });
    }

    // Redirect to exercises page after successful login
    redirect(defaultRedirect);
  });
