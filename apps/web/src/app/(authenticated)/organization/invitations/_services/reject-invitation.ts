import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";
import { APIError } from "better-auth/api";
import { RejectInvitationInput } from "./reject-invitation.schema";

export async function rejectInvitation({
  invitationId,
  headers,
}: RejectInvitationInput & { headers: Headers }) {
  try {
    await auth.api.rejectInvitation({
      body: { invitationId },
      headers,
    });

    return { success: true };
  } catch (error) {
    // Same as accepting: a 4xx APIError carries the copy the toast shows.
    if (error instanceof APIError && error.statusCode < 500) {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
}
