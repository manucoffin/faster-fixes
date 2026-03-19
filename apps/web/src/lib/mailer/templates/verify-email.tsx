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

interface VerifyEmailProps {
  verificationLink?: string;
}

export const VerifyEmail = ({ verificationLink }: VerifyEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-secondary py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-card px-[40px] py-[40px]">
            <Section>
              <Text className="mt-0 mb-[24px] text-[24px] font-bold text-foreground">
                Verify your email address
              </Text>

              <Text className="mt-0 mb-[24px] text-[16px] leading-[24px] text-foreground">
                Hello,
              </Text>

              <Text className="mt-0 mb-[32px] text-[16px] leading-[24px] text-foreground">
                Thank you for signing up! To complete your account setup,
                please click the button below to verify your email address.
              </Text>

              <Section className="mb-[32px] text-center">
                <Button
                  href={verificationLink}
                  className="box-border bg-primary px-[32px] py-[12px] text-[16px] font-medium text-primary-foreground no-underline"
                >
                  Verify my email
                </Button>
              </Section>

              <Text className="mt-0 mb-[24px] text-[14px] leading-[20px] text-muted-foreground">
                If you can&apos;t click the button, copy and paste this
                link into your browser:
              </Text>

              <Text className="mt-0 mb-[32px] text-[14px] break-all text-muted-foreground">
                {verificationLink}
              </Text>

              <Hr className="my-[32px] border-border" />

              <Text className="mt-0 mb-[8px] text-[12px] text-muted-foreground">
                If you didn&apos;t create an account, you can safely
                ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
