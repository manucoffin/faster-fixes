import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";

export async function updatePassword({
  currentPassword,
  newPassword,
  headers,
}: {
  currentPassword: string;
  newPassword: string;
  headers: Headers;
}) {
  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers,
    });

    return { success: true };
  } catch (error) {
    // Better Auth reports a rejected current password through the message, not
    // a code. It is a rejected input, not a missing session.
    if (
      error instanceof Error &&
      (error.message.includes("Invalid") || error.message.includes("incorrect"))
    ) {
      throw new BadRequestError("Current password is incorrect.");
    }

    throw error;
  }
}
