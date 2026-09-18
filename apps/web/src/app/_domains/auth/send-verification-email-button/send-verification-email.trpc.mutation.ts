import { auth } from "@/server/auth";
import { publicProcedure } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { SendVerificationEmailSchema } from "./send-verification-email.schema";

export const sendVerificationEmail = publicProcedure
  .input(SendVerificationEmailSchema)
  .mutation(async ({ input }) => {
    const normalizedEmail = input.email.toLowerCase().trim();

    try {
      // Use Better Auth's sendVerificationEmail to send the verification link
      await auth.api.sendVerificationEmail({
        body: {
          email: normalizedEmail,
        },
        headers: await headers(),
      });

      return {
        success: true,
        message: "Verification email sent successfully.",
      };
    } catch (error) {
      // Better Auth reports a missing account as a 404 APIError rather than a
      // distinct error class, so both shapes have to be probed.
      const isUnknownAccount =
        (error instanceof Error && error.message.includes("not found")) ||
        (typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          error.statusCode === 404);

      if (isUnknownAccount) {
        throw new Error("This user does not exist.");
      }

      throw new Error("Error sending email. Please try again.");
    }
  });
