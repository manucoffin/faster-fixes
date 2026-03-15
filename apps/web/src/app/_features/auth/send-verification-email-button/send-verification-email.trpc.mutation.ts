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
    } catch (error: any) {
      // Handle Better Auth errors
      if (error?.message?.includes("not found") || error?.statusCode === 404) {
        throw new Error("This user does not exist.");
      }

      throw new Error("Error sending email. Please try again.");
    }
  });
