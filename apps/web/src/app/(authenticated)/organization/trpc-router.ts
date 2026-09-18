import { enforceLimit } from "@/server/trpc/middlewares/enforce-limit";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { createInvitation } from "./_services/create-invitation";
import { CreateInvitationSchema } from "./_services/create-invitation.schema";
import { deleteInvitation } from "./_services/delete-invitation";
import { DeleteInvitationSchema } from "./_services/delete-invitation.schema";
import { deleteMember } from "./_services/delete-member";
import { DeleteMemberSchema } from "./_services/delete-member.schema";
import { getOrganizationDetails } from "./_services/get-organization-details";
import { GetOrganizationDetailsSchema } from "./_services/get-organization-details.schema";
import { leaveOrganization } from "./_services/leave-organization";
import { LeaveOrganizationSchema } from "./_services/leave-organization.schema";
import { listInvitations } from "./_services/list-invitations";
import { ListInvitationsSchema } from "./_services/list-invitations.schema";
import { updateMemberRole } from "./_services/update-member-role";
import { UpdateMemberRoleSchema } from "./_services/update-member-role.schema";
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
    // The seat limit is a plan fact the context answers, so it stays on the
    // procedure as the middleware it already was.
    create: planAwareProcedure
      .use(enforceLimit("seats"))
      .input(CreateInvitationSchema)
      .mutation(async ({ input, ctx }) =>
        createInvitation({
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          userId: ctx.session.user.id,
          headers: await headers(),
        }),
      ),
    list: protectedProcedure
      .input(ListInvitationsSchema)
      .query(({ input, ctx }) =>
        listInvitations({
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        }),
      ),
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
    delete: protectedProcedure
      .input(DeleteInvitationSchema)
      .mutation(({ input, ctx }) =>
        deleteInvitation({
          invitationId: input.invitationId,
          userId: ctx.session.user.id,
        }),
      ),
  }),
  member: router({
    updateRole: protectedProcedure
      .input(UpdateMemberRoleSchema)
      .mutation(({ input, ctx }) =>
        updateMemberRole({
          memberId: input.memberId,
          role: input.role,
          userId: ctx.session.user.id,
        }),
      ),
    delete: protectedProcedure
      .input(DeleteMemberSchema)
      .mutation(({ input, ctx }) =>
        deleteMember({
          memberId: input.memberId,
          userId: ctx.session.user.id,
        }),
      ),
  }),
});
