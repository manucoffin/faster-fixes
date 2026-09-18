import { auth } from "@/server/auth";

export async function stopImpersonate({ headers }: { headers: Headers }) {
  const session = await auth.api.stopImpersonating({ headers });

  return { success: true, session };
}
