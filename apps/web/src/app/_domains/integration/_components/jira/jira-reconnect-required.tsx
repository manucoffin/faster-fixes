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

import { emailTailwindConfig } from "@/lib/mailer/templates/tailwind.config";

export interface JiraReconnectRequiredProps {
  organizationName?: string;
  siteName?: string;
  integrationsLink?: string;
}

const baseUrl = getAppUrl();

export const JiraReconnectRequired = ({
  organizationName = "your organization",
  siteName = "your Jira site",
  integrationsLink = `${baseUrl}/integrations`,
}: JiraReconnectRequiredProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-secondary py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-card px-[40px] py-[40px]">
            <Section>
              <Text className="mt-0 mb-[24px] text-[24px] font-bold text-foreground">
                Jira sync has stopped
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                The Jira authorization for <strong>{organizationName}</strong>{" "}
                is no longer valid, so Faster Fixes has stopped syncing with{" "}
                <strong>{siteName}</strong>. This usually happens when the
                person who connected Jira loses access to the site or revokes
                the authorization.
              </Text>

              <Text className="mt-0 mb-[32px] text-[16px] leading-[24px] text-foreground">
                Reconnect to resume syncing. Your linked projects and their
                settings are preserved.
              </Text>

              <Section className="mb-[32px] text-center">
                <Button
                  href={integrationsLink}
                  className="box-border bg-primary px-[32px] py-[12px] text-[16px] font-medium text-primary-foreground no-underline"
                >
                  Reconnect Jira
                </Button>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] leading-[20px] text-muted-foreground">
                If you can&apos;t click the button, copy and paste this link
                into your browser:
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] break-all text-muted-foreground">
                {integrationsLink}
              </Text>

              <Hr className="my-[32px] border-border" />

              <Text className="mt-0 mb-[8px] text-[12px] text-muted-foreground">
                Feedback is still collected while Jira is disconnected. Only the
                mirroring to Jira issues is paused.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
