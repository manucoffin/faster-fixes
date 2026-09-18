import { auth } from "@/server/auth";

export async function impersonateUser({
  userId,
  headers,
}: {
  userId: string;
  headers: Headers;
}) {
  const session = await auth.api.impersonateUser({
    body: { userId },
    headers,
  });

  return { success: true, session };
}
