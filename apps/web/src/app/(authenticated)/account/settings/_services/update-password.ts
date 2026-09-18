import { auth } from "@/server/auth";

export async function updatePassword({
  currentPassword,
  newPassword,
  headers,
}: {
  currentPassword: string;
  newPassword: string;
  headers: Headers;
}) {
  await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    },
    headers,
  });

  return { success: true };
}
