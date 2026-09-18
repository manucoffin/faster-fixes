import { resetPasswordUrl } from "@/app/_constants/routes";
import { auth } from "@/server/auth";
import { NotFoundError } from "@/server/errors/domain-errors";

export async function requestPasswordReset({
  email,
  headers,
}: {
  email: string;
  headers: Headers;
}) {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    return await auth.api.requestPasswordReset({
      body: {
        email: normalizedEmail,
        redirectTo: resetPasswordUrl,
      },
      headers,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("not found") ||
        error.message.includes("does not exist"))
    ) {
      throw new NotFoundError("This email does not exist in our system");
    }

    throw error;
  }
}
