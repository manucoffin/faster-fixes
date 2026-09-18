import { createInvitation } from "@/app/(authenticated)/organization/_features/members/create-invitation/create-invitation.trpc.mutation";
import { deleteInvitation } from "@/app/(authenticated)/organization/_features/members/delete-invitation/delete-invitation.trpc.mutation";
import { deleteMember } from "@/app/(authenticated)/organization/_features/members/delete/delete-member.trpc.mutation";
import { getInvitations } from "@/app/(authenticated)/organization/_features/members/get-invitations.trpc.query";
import { updateMemberRole } from "@/app/(authenticated)/organization/_features/members/update-role/update-member-role.trpc.mutation";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { getOrganizationDetails } from "./_services/get-organization-details";
import { GetOrganizationDetailsSchema } from "./_services/get-organization-details.schema";
import { leaveOrganization } from "./_services/leave-organization";
import { LeaveOrganizationSchema } from "./_services/leave-organization.schema";
import { updateOrganization } from "./_services/update-organization";
import { updateOrganizationLogo } from "./_services/update-organization-logo";
import { UpdateOrganizationLogoSchema } from "./_services/update-organization-logo.schema";
import { UpdateOrganizationSchema } from "./_services/update-organization.schema";
import { acceptInvitation } from "./invitations/_services/accept-invitation";
import { AcceptInvitationSchema } from "./invitations/_services/accept-invitation.schema";
import { listReceivedInvitations } from "./invitations/_services/list-received-invitations";
import { rejectInvitation } from "./invitations/_services/reject-invitation";
import { RejectInvitationSchema } from "./invitations/_services/reject-invitation.schema";

// Membership and role are facts about a loaded Organization, so every denial of
// this scope lives in the service that loads it, not in a procedure.
export const organizationRouter = router({
  get: protectedProcedure
    .input(GetOrganizationDetailsSchema)
    .query(({ input, ctx }) =>
      getOrganizationDetails({
        organizationId: input.organizationId,
        userId: ctx.session.user.id,
      }),
    ),
  update: protectedProcedure
    .input(UpdateOrganizationSchema)
    .mutation(({ input, ctx }) =>
      updateOrganization({
        organizationId: input.organizationId,
        name: input.name,
        userId: ctx.session.user.id,
      }),
    ),
  updateLogo: protectedProcedure
    .input(UpdateOrganizationLogoSchema)
    .mutation(({ input, ctx }) =>
      updateOrganizationLogo({
        organizationId: input.organizationId,
        userId: ctx.session.user.id,
      }),
    ),
  leave: protectedProcedure
    .input(LeaveOrganizationSchema)
    .mutation(({ input, ctx }) =>
      leaveOrganization({
        organizationId: input.organizationId,
        userId: ctx.session.user.id,
      }),
    ),
  invitation: router({
    create: createInvitation,
    get: getInvitations,
    listReceived: protectedProcedure.query(({ ctx }) =>
      listReceivedInvitations({ email: ctx.session.user.email }),
    ),
    accept: protectedProcedure
      .input(AcceptInvitationSchema)
      .mutation(async ({ input }) =>
        acceptInvitation({
          invitationId: input.invitationId,
          headers: await headers(),
        }),
      ),
    reject: protectedProcedure
      .input(RejectInvitationSchema)
      .mutation(async ({ input }) =>
        rejectInvitation({
          invitationId: input.invitationId,
          headers: await headers(),
        }),
      ),
    delete: deleteInvitation,
  }),
  member: router({
    updateRole: updateMemberRole,
    delete: deleteMember,
  }),
});
