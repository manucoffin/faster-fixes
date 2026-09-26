import { auth } from "@/server/auth";
import {
  BadRequestError,
  PreconditionFailedError,
} from "@/server/errors/domain-errors";

export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const data = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return data.user;
  } catch (error) {
    // Better Auth reports both refusals through the message, not a code.
    if (
      error instanceof Error &&
      error.message.includes("Email not verified")
    ) {
      // PRECONDITION_FAILED is reserved for this case here, so the login form
      // can offer to resend the verification email without matching on copy.
      throw new PreconditionFailedError(
        "Verify your email address before signing in.",
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes("Invalid") || error.message.includes("password"))
    ) {
      // Rejected credentials are a rejected input, not a missing session.
      throw new BadRequestError("Invalid email or password");
    }

    throw error;
  }
}

export type SignInUserOutput = Awaited<ReturnType<typeof signInUser>>;
