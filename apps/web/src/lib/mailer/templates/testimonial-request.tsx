import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Tailwind,
  Text,
} from "@react-email/components";

import { emailTailwindConfig } from "./tailwind.config";

export type TestimonialRequestEmailProps = {
  recipientName?: string;
  feedbackCount: number;
  organizationName: string;
  formUrl: string;
  declineUrl: string;
};

const paragraph = "mt-0 mb-[16px] text-[15px] leading-[22px] text-foreground";

// Same hand-typed style as the welcome email: no layout, no Preview, no
// button, the link written out in full.
export function TestimonialRequestEmail({
  recipientName,
  feedbackCount,
  organizationName,
  formUrl,
  declineUrl,
}: TestimonialRequestEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={emailTailwindConfig}>
        <Head />
        <Body className="bg-background font-sans">
          <Container className="mx-0 max-w-[560px] px-[8px] py-[8px]">
            <Text className={paragraph}>
              {recipientName ? `Hi ${recipientName},` : "Hi,"}
            </Text>

            <Text className={paragraph}>
              Your team has handled {feedbackCount} reports through Faster Fixes
              so far. Thanks for trusting it with real work.
            </Text>

            <Text className={paragraph}>
              I have a favor to ask: would you take two minutes to share your
              experience?
            </Text>

            <Text className={paragraph}>
              A few sentences and a rating is all it takes. Your name, photo and
              a link to {organizationName} go with the quote, so people who read
              it can find you.
            </Text>

            <Text className={paragraph}>
              <Link href={formUrl}>{formUrl}</Link>
            </Text>

            <Text className={paragraph}>
              It helps more than you&apos;d think.
            </Text>

            <Text className="mt-0 mb-[32px] text-[15px] leading-[22px] text-foreground">
              Manuel
            </Text>

            <Text className="mt-0 mb-0 text-[12px] leading-[18px] text-muted-foreground">
              Don&apos;t want to be asked again?{" "}
              <Link href={declineUrl} className="text-muted-foreground">
                {declineUrl}
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
