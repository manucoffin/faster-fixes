import { auth } from "@/server/auth";
import { ConflictError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import { randomBytes } from "crypto";

// The admin form sends "" for a name left blank, which is stored as no value.
function emptyToNull(value: string | undefined) {
  return value === undefined || value === "" ? null : value;
}

export async function createUser(
  {
    email,
    name,
    firstName,
    lastName,
  }: {
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
  },
  db: typeof prisma = prisma,
) {
  // The account is created with a throwaway password: the admin sends a reset
  // link afterwards, the password is never shown to anyone.
  const randomPassword = randomBytes(16).toString("hex");

  let data;
  try {
    // Better Auth creates User and Account atomically and fires the database
    // hooks that add MarketingPreferences and the default Organization.
    data = await auth.api.signUpEmail({
      body: { name, email, password: randomPassword },
    });
  } catch (error) {
    // Better Auth reports a taken address as a plain error whose message names
    // the field; the wording below is what the admin dialog shows.
    if (error instanceof Error && error.message.includes("email")) {
      throw new ConflictError("This email is already registered");
    }

    console.error("[createUser] Error:", error);
    throw error;
  }

  const userId = data.user.id;

  if (firstName || lastName) {
    const names = {
      firstName: emptyToNull(firstName),
      lastName: emptyToNull(lastName),
    };
    await db.profile.upsert({
      where: { userId },
      update: names,
      create: { userId, ...names },
    });
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    name: data.user.name,
  };
}
