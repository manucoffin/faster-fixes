"use server";

import { auth } from "@/server/auth";
import { actionClient, ActionError, ErrorCode } from "@/server/safe-action";
import { redirect } from "next/navigation";
import { SignupSchema } from "./signup.schema";

export const signupAction = actionClient
  .inputSchema(SignupSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { email, password } = parsedInput;

      // Call the better-auth signup method
      const data = await auth.api.signUpEmail({
        body: {
          name: email.split("@")[0],
          email,
          password,
        },
      });

      if (!data) {
        throw new ActionError(
          "Failed to create account",
          ErrorCode.BAD_REQUEST
        );
      }
    } catch (error) {
      console.error("ERROR", error);
      if (error instanceof ActionError) {
        throw error;
      }

      // Handle duplicate email
      if (error instanceof Error && error.message.includes("email")) {
        throw new ActionError(
          "Email already registered",
          ErrorCode.ALREADY_EXISTS
        );
      }

      throw new ActionError(
        "Failed to create account. Please try again.",
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    // Redirect to exercises page after successful signup
    redirect("/exercises");
  });
