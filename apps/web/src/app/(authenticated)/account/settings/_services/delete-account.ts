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
      // Identity failures have no domain error: the procedure answers them at
      // the transport edge. They are matched here only to keep the original
      // order of precedence, in which they win over the OAuth branch.
      const isIdentityFailure =
        error.message.includes("Invalid") ||
        error.message.includes("incorrect") ||
        error.message.includes("password") ||
        error.message.includes("session") ||
        error.message.includes("Session");

      if (
        !isIdentityFailure &&
        (error.message.includes("OAuth") || error.message.includes("provider"))
      ) {
        throw new BadRequestError(
          "Please contact support to delete your account.",
        );
      }
    }

    throw error;
  }
}
