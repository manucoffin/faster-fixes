import { resetPasswordUrl } from "@/lib/routing";
import { getAppUrl } from "@/utils/url/get-app-url";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  resetPasswordLink?: string;
}

const baseUrl = getAppUrl();

export const ResetPasswordEmail = ({
  resetPasswordLink,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Réinitialisez votre mot de passe Tobalgo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/static/logo.png`}
            width="40"
            height="33"
            alt="Logo"
          />
          <Section>
            <Text style={text}>Bonjour,</Text>
            <Text style={text}>
              Nous avons reçu une demande de réinitialisation de votre mot de
              passe Tobalgo. Cliquez sur le bouton ci-dessous pour choisir un
              nouveau mot de passe :
            </Text>
            <Button style={button} href={resetPasswordLink}>
              Réinitialiser le mot de passe
            </Button>
            <Text style={text}>
              Si vous n&apos;avez pas demandé cette réinitialisation de mot de
              passe, vous pouvez ignorer cet email en toute sécurité. Votre mot
              de passe restera inchangé.
            </Text>
            <Text style={text}>
              Pour des raisons de sécurité, veuillez ne pas transférer cet email
              à quiconque.
            </Text>
            <Text style={text}>Cordialement,</Text>
            <Text style={text}>L&apos;équipe Tobalgo</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};


ResetPasswordEmail.PreviewProps = {
  userFirstname: "Manuel",
  resetPasswordLink: `${baseUrl}/${resetPasswordUrl}`,
} as ResetPasswordEmailProps;

const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: "300",
  color: "#404040",
  lineHeight: "26px",
};

const button = {
  backgroundColor: "#007ee6",
  borderRadius: "4px",
  color: "#fff",
  fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "210px",
  padding: "14px 7px",
};

const anchor = {
  textDecoration: "underline",
};
