import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";

export async function stopImpersonate({ headers }: { headers: Headers }) {
  const current = await auth.api.getSession({ headers });

  if (!current?.session.impersonatedBy) {
    throw new BadRequestError("User is not currently impersonating");
  }

  const session = await auth.api.stopImpersonating({ headers });

  return { success: true, session };
}
