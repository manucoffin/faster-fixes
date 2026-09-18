import { auth } from "@/server/auth";
import {
  BadRequestError,
  ConflictError,
  DomainError,
} from "@/server/errors/domain-errors";

export async function registerUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const name = email.split("@")[0] || email;
    const data = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!data) {
      throw new BadRequestError("Account creation failed");
    }

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
