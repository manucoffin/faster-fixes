import {
  Body,
  Container,
  Head,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { emailTailwindConfig } from "./tailwind.config";

export type WelcomeEmailProps = {
  userName?: string;
};

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-secondary py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] bg-card px-[40px] py-[40px]">
            <Section>
              <Text className="mt-0 mb-[16px] text-[16px] leading-[24px] text-foreground">
                {userName ? `Hi ${userName},` : "Hi,"}
              </Text>

              <Text className="mt-0 mb-[16px] text-[16px] leading-[24px] text-foreground">
                Welcome to Faster Fixes! 🙂
              </Text>

              <Text className="mt-0 mb-[16px] text-[16px] leading-[24px] text-foreground">
                I&apos;m Manuel, the founder of the app. Thanks for signing up.
                As a solo founder, it really means a lot! 🙏
              </Text>

              <Text className="mt-0 mb-[16px] text-[16px] leading-[24px] text-foreground">
                I&apos;m curious: what problem does Faster Fixes solve for you?
              </Text>

              <Text className="mt-0 mb-[16px] text-[16px] leading-[24px] text-foreground">
                You can simply reply to this email. I read every response
                myself, and it&apos;ll help me make Faster Fixes more useful.
              </Text>

              <Text className="mt-0 mb-[4px] text-[16px] leading-[24px] text-foreground">
                Best,
              </Text>
              <Text className="mt-0 mb-[16px] text-[16px] leading-[24px] text-foreground">
                Manuel
              </Text>

              <Text className="mt-0 mb-0 text-[14px] leading-[20px] text-muted-foreground">
                P.S. Let me know if you have any issue setting up the tool.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
