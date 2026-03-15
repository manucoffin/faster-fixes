import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface UserFeedbackProps {
  senderName?: string;
  senderEmail?: string;
  message?: string;
}

export const UserFeedback = ({
  senderName = "Un utilisateur",
  senderEmail = "utilisateur@exemple.com",
  message = "Ceci est un exemple de feedback.",
}: UserFeedbackProps) => {
  return (
    <Html lang="fr" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white max-w-[600px] mx-auto px-[40px] py-[40px]">
            <Section>
              <Text className="text-[24px] font-bold text-gray-900 mb-[24px] mt-0">
                Nouveau feedback
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                <strong>{senderName}</strong> ({senderEmail}) a envoyé un
                feedback :
              </Text>

              <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[16px] mb-[32px]">
                <Text className="text-[16px] text-gray-800 mt-0 mb-0 leading-[24px] whitespace-pre-line">
                  {message}
                </Text>
              </Section>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[12px] text-gray-400 mb-[8px] mt-0">
                Ce message a été envoyé via le formulaire de feedback de
                l&apos;application.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
