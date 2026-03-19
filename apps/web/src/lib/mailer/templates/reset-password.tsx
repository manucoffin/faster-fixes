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

interface ResetPasswordProps {
  resetPasswordLink?: string;
}

const baseUrl = getAppUrl();

export const ResetPassword = ({
  resetPasswordLink,
}: ResetPasswordProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-secondary py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-card px-[40px] py-[40px]">
            <Section>
              <Text className="mt-0 mb-[24px] text-[24px] font-bold text-foreground">
                Password reset
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                Hello,
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                You requested a password reset. Click the button below
                to create a new password.
              </Text>

              <Text className="mt-0 mb-[32px] text-[16px] leading-[24px] text-foreground">
                This link will expire in 24 hours for security reasons.
              </Text>

              <Section className="mb-[32px] text-center">
                <Button
                  href={resetPasswordLink}
                  className="box-border bg-primary px-[32px] py-[12px] text-[16px] font-medium text-primary-foreground no-underline"
                >
                  Reset my password
                </Button>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] leading-[20px] text-muted-foreground">
                If you can&apos;t click the button, copy and paste this
                link into your browser:
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] break-all text-muted-foreground">
                {resetPasswordLink}
              </Text>

              <Hr className="my-[32px] border-border" />

              <Text className="mt-0 mb-[8px] text-[12px] text-muted-foreground">
                If you didn&apos;t request this reset, you can safely
                ignore this email. Your password will remain unchanged.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
