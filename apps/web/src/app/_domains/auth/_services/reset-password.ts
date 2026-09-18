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

  // An invalid or expired token is an identity failure, which the vocabulary
  // does not cover: the procedure maps it to UNAUTHORIZED.
  return auth.api.resetPassword({
    body: {
      newPassword: password,
      token,
    },
    headers,
  });
}
