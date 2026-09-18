import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";
import { AcceptInvitationInput } from "./accept-invitation.schema";

export async function acceptInvitation({
  invitationId,
  headers,
}: AcceptInvitationInput & { headers: Headers }) {
  try {
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers,
    });

    return { success: true };
  } catch (error) {
    // Better-Auth reports an expired, already answered or foreign invitation as
    // a plain Error, and its message is the copy the toast shows.
    if (error instanceof Error) {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
}
