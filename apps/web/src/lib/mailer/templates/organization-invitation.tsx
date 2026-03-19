import { getAppUrl } from "@/utils/url/get-app-url";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { emailTailwindConfig } from "./tailwind.config";

interface OrganizationInvitationProps {
  organizationName?: string;
  inviterName?: string;
  invitationLink?: string;
  role?: string;
}

const baseUrl = getAppUrl();

export const OrganizationInvitation = ({
  organizationName = "My organization",
  inviterName = "A user",
  invitationLink = `${baseUrl}/organization/invitations`,
  role = "member",
}: OrganizationInvitationProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-secondary py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-card px-[40px] py-[40px]">
            <Section>
              <Text className="mt-0 mb-[24px] text-[24px] font-bold text-foreground">
                Invitation to join an organization
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                Hello,
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                <strong>{inviterName}</strong> has invited you to join
                the organization <strong>{organizationName}</strong> as
                a <strong>{role}</strong>.
              </Text>

              <Text className="mt-0 mb-[32px] text-[16px] leading-[24px] text-foreground">
                Click the button below to accept the invitation.
              </Text>

              <Section className="mb-[32px] text-center">
                <Button
                  href={invitationLink}
                  className="box-border bg-primary px-[32px] py-[12px] text-[16px] font-medium text-primary-foreground no-underline"
                >
                  View invitation
                </Button>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] leading-[20px] text-muted-foreground">
                If you can&apos;t click the button, copy and paste this
                link into your browser:
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] break-all text-muted-foreground">
                {invitationLink}
              </Text>

              <Hr className="my-[32px] border-border" />

              <Text className="mt-0 mb-[8px] text-[12px] text-muted-foreground">
                If you weren&apos;t expecting this invitation, you can
                safely ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
