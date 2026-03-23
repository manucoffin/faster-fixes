import { createInvitation } from "@/app/(authenticated)/organization/_features/members/create-invitation/create-invitation.trpc.mutation";
import { deleteInvitation } from "@/app/(authenticated)/organization/_features/members/delete-invitation/delete-invitation.trpc.mutation";
import { deleteMember } from "@/app/(authenticated)/organization/_features/members/delete/delete-member.trpc.mutation";
import { updateMemberRole } from "@/app/(authenticated)/organization/_features/members/update-role/update-member-role.trpc.mutation";
import { acceptInvitation } from "@/app/(authenticated)/organization/invitations/_features/accept-invitation/accept-invitation.trpc.mutation";
import { getReceivedInvitations } from "@/app/(authenticated)/organization/invitations/_features/get-received-invitations.trpc.query";
import { rejectInvitation } from "@/app/(authenticated)/organization/invitations/_features/reject-invitation/reject-invitation.trpc.mutation";
import { router } from "@/server/trpc/trpc";
import { createAgentToken } from "../_features/agent-tokens/create-agent-token.trpc.mutation";
import { deleteAgentToken } from "../_features/agent-tokens/delete-agent-token.trpc.mutation";
import { getAgentTokens } from "../_features/agent-tokens/get-agent-tokens.trpc.query";
import { revokeAgentToken } from "../_features/agent-tokens/revoke-agent-token.trpc.mutation";
import { getOrganizationDetails } from "../_features/general/get-organization-details.trpc.query";
import { updateOrganizationLogo } from "../_features/general/update-organization-logo.trpc.mutation";
import { updateOrganization } from "../_features/general/update-organization.trpc.mutation";
import { leaveOrganization } from "../_features/leave-organization/leave-organization.trpc.mutation";
import { getInvitations } from "../_features/members/get-invitations.trpc.query";

export const organizationRouter = router({
  get: getOrganizationDetails,
  update: updateOrganization,
  updateLogo: updateOrganizationLogo,
  leave: leaveOrganization,
  invitation: router({
    create: createInvitation,
    get: getInvitations,
    getReceived: getReceivedInvitations,
    accept: acceptInvitation,
    reject: rejectInvitation,
    delete: deleteInvitation,
  }),
  member: router({
    updateRole: updateMemberRole,
    delete: deleteMember,
  }),
  agentToken: router({
    list: getAgentTokens,
    create: createAgentToken,
    revoke: revokeAgentToken,
    delete: deleteAgentToken,
  }),
});
