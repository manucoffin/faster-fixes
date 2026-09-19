import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";

export async function resetPassword({
  token,
  password,
  headers,
}: {
  token: string;
  password: string;
  headers: Headers;
}) {
  if (!token) {
    throw new BadRequestError("Missing token. Invalid reset link.");
  }

  try {
    return await auth.api.resetPassword({
      body: {
        newPassword: password,
        token,
      },
      headers,
    });
  } catch (error) {
    // Better Auth reports a rejected reset token through its message, not a
    // code. A refused token is a rejected input, not a missing session.
    if (
      error instanceof Error &&
      (error.message.includes("Invalid") ||
        error.message.includes("token") ||
        error.message.includes("expired"))
    ) {
      throw new BadRequestError("The reset link is invalid or has expired.");
    }

    throw error;
  }
}
