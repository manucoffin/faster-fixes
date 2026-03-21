import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL, TEST_RECIPIENT_EMAIL } from "@/lib/mailer/constants";
import { OrganizationInvitation } from "@/lib/mailer/templates/organization-invitation";
import { ORGANIZATION_ROLES } from "@/app/_features/organization/_utils/organization-roles";
import { getAppUrl } from "@/utils/url/get-app-url";
import { render } from "@react-email/components";
import { organization } from "better-auth/plugins";

export const organizationPlugin = organization({
  schema: {
    organization: {
      additionalFields: {
        isDefault: {
          type: "boolean",
          required: true,
          defaultValue: false,
        },
      },
    },
  },
  sendInvitationEmail: async (data) => {
    try {
      const { email, organization: org, inviter } = data;
      const normalizedEmail = email.toLowerCase().trim();
      const from = SENDER_EMAIL;
      const to =
        process.env.NODE_ENV === "production"
          ? normalizedEmail
          : TEST_RECIPIENT_EMAIL;
      const inviterName = inviter.user.name || inviter.user.email;
      const role =
        ORGANIZATION_ROLES[data.role as keyof typeof ORGANIZATION_ROLES] ??
        data.role;
      const invitationLink = `${getAppUrl()}/organization/invitations`;

      const body = await render(
        <OrganizationInvitation
          organizationName={org.name}
          inviterName={inviterName}
          invitationLink={invitationLink}
          role={role}
        />,
      );

      await mailer.emails.send({
        from,
        to,
        subject: `Invitation to join ${org.name}`,
        body,
      });
    } catch (error) {
      console.error("Error sending organization invitation email:", error);
    }
  },
});
