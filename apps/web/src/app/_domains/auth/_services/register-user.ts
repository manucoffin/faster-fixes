import { auth } from "@/server/auth";
import { ConflictError, DomainError } from "@/server/errors/domain-errors";

export async function registerUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const localPart = email.split("@")[0];
    // An address starting with "@" has an empty local part, so the whole address becomes the name.
    const name =
      localPart === undefined || localPart === "" ? email : localPart;
    const data = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    return data.user;
  } catch (error) {
    console.error(error);

    if (error instanceof DomainError) {
      throw error;
    }

    // Better Auth reports a taken address through the message, not a code.
    if (error instanceof Error && error.message.includes("email")) {
      throw new ConflictError("Email already registered");
    }

    throw error;
  }
}
