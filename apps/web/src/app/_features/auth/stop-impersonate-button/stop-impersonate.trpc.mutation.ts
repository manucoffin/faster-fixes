import { auth } from "@/server/auth";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";

export const stopImpersonate = protectedProcedure.mutation(async ({ ctx }) => {
  try {
    // Verify user is currently impersonating
    if (!ctx.session?.session?.impersonatedBy) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is not currently impersonating",
      });
    }

    // Call better-auth stop impersonation API
    const data = await auth.api.stopImpersonating({
      headers: await headers(),
    });

    return { success: true, session: data };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Failed to stop impersonating user",
    });
  }
});
