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
    <Html lang="fr" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white max-w-[600px] mx-auto px-[40px] py-[40px]">
            <Section>
              <Text className="text-[24px] font-bold text-gray-900 mb-[24px] mt-0">
                Invitation à rejoindre une organisation
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                Bonjour,
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                <strong>{inviterName}</strong> vous invite à rejoindre
                l&apos;organisation <strong>{organizationName}</strong> en tant
                que <strong>{role}</strong>.
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[32px] mt-0 leading-[24px]">
                Cliquez sur le bouton ci-dessous pour accepter l&apos;invitation.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={invitationLink}
                  className="bg-black text-white px-[32px] py-[12px] text-[16px] font-medium no-underline box-border"
                >
                  Voir l&apos;invitation
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-500 mb-[24px] mt-0 leading-[20px]">
                Si vous n&apos;arrivez pas à cliquer sur le bouton, copiez et
                collez ce lien dans votre navigateur :
              </Text>

              <Text className="text-[14px] text-gray-500 mb-[32px] mt-0 break-all">
                {invitationLink}
              </Text>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[12px] text-gray-400 mb-[8px] mt-0">
                Si vous n&apos;attendiez pas cette invitation, vous pouvez
                ignorer cet email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
