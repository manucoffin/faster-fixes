import {
  Body,
  Container,
  Head,
  Html,
  Tailwind,
  Text,
} from "@react-email/components";

import { emailTailwindConfig } from "./tailwind.config";

export type WelcomeEmailProps = {
  userName?: string;
};

// Deliberately unstyled and without a Preview: the inbox shows the opening
// lines, as it would for a note typed by hand.
export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-background font-sans">
          <Container className="mx-0 max-w-[560px] px-[8px] py-[8px]">
            <Text className="mt-0 mb-[16px] text-[15px] leading-[22px] text-foreground">
              {userName ? `Hi ${userName},` : "Hi,"}
            </Text>

            <Text className="mt-0 mb-[16px] text-[15px] leading-[22px] text-foreground">
              Thanks for signing up. I&apos;m Manuel, I build Faster Fixes on my
              own.
            </Text>

            <Text className="mt-0 mb-[16px] text-[15px] leading-[22px] text-foreground">
              One quick question: are you collecting feedback for client
              websites (agency or freelance), or for your own product?
            </Text>

            <Text className="mt-0 mb-[16px] text-[15px] leading-[22px] text-foreground">
              A one-word reply is enough. If anything blocks you while
              installing the widget, reply here and I&apos;ll help directly.
            </Text>

            <Text className="mt-0 mb-0 text-[15px] leading-[22px] text-foreground">
              Manuel
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
