"use server";

import { auth } from "@/server/auth";
import { adminProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { CreateUserSchema } from "./create-user.schema";
import { prisma } from "@workspace/db";

export const createUser = adminProcedure
  .input(CreateUserSchema)
  .mutation(async ({ input }) => {
    try {
      // Generate a secure random password (user will reset it later)
      const randomPassword = randomBytes(16).toString("hex");

      // Use Better Auth to create the user
      // This atomically creates User + Account and triggers database hooks
      // (which create MarketingPreferences + default Organization)
      const data = await auth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: randomPassword,
        },
      });

      if (!data?.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create account",
        });
      }

      const userId = data.user.id;

      // Create or update profile with firstName/lastName if provided
      if (input.firstName || input.lastName) {
        await prisma.profile.upsert({
          where: { userId },
          update: {
            firstName: input.firstName || null,
            lastName: input.lastName || null,
          },
          create: {
            userId,
            firstName: input.firstName || null,
            lastName: input.lastName || null,
          },
        });
      }

      return {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.name,
      };
    } catch (error) {
      console.error("[createUser] Error:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      // Handle duplicate email
      if (error instanceof Error && error.message.includes("email")) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already registered",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user. Please try again.",
      });
    }
  });
