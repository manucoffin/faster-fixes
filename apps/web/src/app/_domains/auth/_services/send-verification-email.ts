import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors/domain-errors";

export async function sendVerificationEmail({
  email,
  headers,
}: {
  email: string;
  headers: Headers;
}) {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    await auth.api.sendVerificationEmail({
      body: {
        email: normalizedEmail,
      },
      headers,
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
      throw new NotFoundError("This user does not exist.");
    }

    throw error;
  }
}
