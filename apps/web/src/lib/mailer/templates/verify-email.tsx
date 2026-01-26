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
} from '@react-email/components';

interface VerifyEmailProps {
  verificationLink?: string;
}

export const VerifyEmail = ({ verificationLink }: VerifyEmailProps) => {
  return (
    <Html lang="fr" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white max-w-[600px] mx-auto px-[40px] py-[40px]">
            <Section>
              <Text className="text-[24px] font-bold text-gray-900 mb-[24px] mt-0">
                Vérifiez votre adresse email
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                Bonjour,
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[32px] mt-0 leading-[24px]">
                Merci de vous être inscrit ! Pour finaliser la création de votre compte,
                veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={verificationLink}
                  className="bg-black text-white px-[32px] py-[12px] text-[16px] font-medium no-underline box-border"
                >
                  Vérifier mon email
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-500 mb-[24px] mt-0 leading-[20px]">
                Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :
              </Text>

              <Text className="text-[14px] text-gray-500 mb-[32px] mt-0 break-all">
                {verificationLink}
              </Text>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[12px] text-gray-400 mb-[8px] mt-0">
                Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

