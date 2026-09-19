import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";

export async function deleteAccount({
  password,
  headers,
}: {
  password: string;
  headers: Headers;
}) {
  try {
    await auth.api.deleteUser({
      body: {
        password,
      },
      headers,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      // Better Auth reports a rejected password through the message, not a
      // code, and it keeps winning over the OAuth branch below: a message
      // naming both tells the User which of the two to act on.
      if (
        error.message.includes("Invalid") ||
        error.message.includes("incorrect") ||
        error.message.includes("password")
      ) {
        throw new BadRequestError("Password is incorrect.");
      }

      if (
        error.message.includes("OAuth") ||
        error.message.includes("provider")
      ) {
        throw new BadRequestError(
          "Please contact support to delete your account.",
        );
      }
    }

    throw error;
  }
}
