import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors/domain-errors";

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
    if (
      error instanceof Error &&
      error.message.includes("Email not verified")
    ) {
      // The sign-in form keys its verification prompt off this exact sentinel.
      throw new ForbiddenError("EMAIL_NOT_VERIFIED");
    }

    // Invalid credentials are an identity failure, which the vocabulary does not
    // cover: the procedure maps it to UNAUTHORIZED.
    throw error;
  }
}
