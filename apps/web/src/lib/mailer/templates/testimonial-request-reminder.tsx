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

export type TestimonialRequestReminderEmailProps = {
  recipientName?: string;
  formUrl: string;
  declineUrl: string;
};

const paragraph = "mt-0 mb-[16px] text-[15px] leading-[22px] text-foreground";

export function TestimonialRequestReminderEmail({
  recipientName,
  formUrl,
  declineUrl,
}: TestimonialRequestReminderEmailProps) {
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
              A quick follow-up on my note from last week.
            </Text>

            <Text className={paragraph}>
              If you have two minutes, I&apos;d really value your take on Faster
              Fixes. Even one sentence makes a difference.
            </Text>

            <Text className={paragraph}>
              <Link href={formUrl}>{formUrl}</Link>
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
