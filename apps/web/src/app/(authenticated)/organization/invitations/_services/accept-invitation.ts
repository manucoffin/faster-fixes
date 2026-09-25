import { auth } from "@/server/auth";
import { BadRequestError } from "@/server/errors/domain-errors";
import { APIError } from "better-auth/api";
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
    // Better Auth reports an expired, already answered or foreign invitation as
    // a 4xx APIError whose message is the copy the toast shows. Anything else is
    // an outage and keeps its 500 masking.
    if (error instanceof APIError && error.statusCode < 500) {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
}
