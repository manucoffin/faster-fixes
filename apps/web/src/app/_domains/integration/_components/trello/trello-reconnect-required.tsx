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

export type TrelloReconnectRequiredProps = {
  organizationName?: string;
  memberDisplayName?: string;
  integrationsLink?: string;
};

const baseUrl = getAppUrl();

export function TrelloReconnectRequired({
  organizationName = "your organization",
  memberDisplayName = "the authorizing Trello member",
  integrationsLink = `${baseUrl}/integrations`,
}: TrelloReconnectRequiredProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-secondary py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-card px-[40px] py-[40px]">
            <Section>
              <Text className="mt-0 mb-[24px] text-[24px] font-bold text-foreground">
                Trello sync has stopped
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                Trello refused the authorization for{" "}
                <strong>{organizationName}</strong>, so Faster Fixes has stopped
                syncing with Trello. The connection relied on{" "}
                <strong>{memberDisplayName}</strong>. This usually happens when
                that member revokes the authorization or loses access to the
                boards.
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
                  Reconnect Trello
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
                Feedback is still collected while Trello is disconnected. Only
                the mirroring to Trello cards is paused.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
