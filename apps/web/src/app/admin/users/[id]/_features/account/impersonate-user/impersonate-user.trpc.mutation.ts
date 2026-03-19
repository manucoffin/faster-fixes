import { auth } from "@/server/auth";
import { adminProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { ImpersonateUserSchema } from "./impersonate-user.schema";

export const impersonateUser = adminProcedure
  .input(ImpersonateUserSchema)
  .mutation(async ({ input, ctx }) => {
    const { userId } = input;

    try {
      // Call better-auth impersonation API
      const data = await auth.api.impersonateUser({
        body: {
          userId,
        },
        headers: await headers(),
      });

      return { success: true, session: data };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to impersonate user",
      });
    }
  });
