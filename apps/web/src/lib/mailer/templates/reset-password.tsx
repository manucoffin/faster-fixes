import { getAppUrl } from '@/utils/url/get-app-url';
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

interface ResetPasswordProps {
  resetPasswordLink?: string;
}

const baseUrl = getAppUrl();

export const ResetPassword = ({
  resetPasswordLink,
}: ResetPasswordProps) => {
  return (
    <Html lang="fr" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white max-w-[600px] mx-auto px-[40px] py-[40px]">
            <Section>
              <Text className="text-[24px] font-bold text-gray-900 mb-[24px] mt-0">
                Réinitialisation de mot de passe
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                Bonjour,
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                Vous avez demandé la réinitialisation de votre mot de passe.
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[32px] mt-0 leading-[24px]">
                Ce lien expirera dans 24 heures pour des raisons de sécurité.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={resetPasswordLink}
                  className="bg-black text-white px-[32px] py-[12px] text-[16px] font-medium no-underline box-border"
                >
                  Réinitialiser mon mot de passe
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-500 mb-[24px] mt-0 leading-[20px]">
                Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :
              </Text>

              <Text className="text-[14px] text-gray-500 mb-[32px] mt-0 break-all">
                {resetPasswordLink}
              </Text>

              <Hr className="border-gray-200 my-[32px]" />

              <Text className="text-[12px] text-gray-400 mb-[8px] mt-0">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
                Votre mot de passe restera inchangé.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

