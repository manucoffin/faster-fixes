import { auth } from "@/server/auth";

export async function revokeUserSessions({
  userId,
  headers,
}: {
  userId: string;
  headers: Headers;
}) {
  await auth.api.revokeUserSessions({
    body: { userId },
    headers,
  });

  return { success: true };
}
