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

interface VerifyEmailProps {
  verificationLink?: string;
}

const baseUrl = getAppUrl();


export const VerifyEmail = ({ verificationLink }: VerifyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Vérifiez votre adresse e-mail Tobalgo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/static/tobalgo-logo.png`}
            width="40"
            height="33"
            alt="Tobalgo"
          />
          <Section>
            <Text style={text}>Bonjour,</Text>
            <Text style={text}>
              Merci de vous être inscrit à Tobalgo ! Veuillez vérifier votre
              adresse e-mail en cliquant sur le bouton ci-dessous :
            </Text>
            <Button style={button} href={verificationLink}>
              Vérifier l&apos;adresse e-mail
            </Button>
            <Text style={text}>
              Si vous n&apos;avez pas créé de compte Tobalgo, vous pouvez
              ignorer e-mail en toute sécurité.
            </Text>
            <Text style={text}>
              Pour des raisons de sécurité, veuillez ne pas transférer cet
              e-mail à qui que ce soit.
            </Text>
            <Text style={text}>Cordialement,</Text>
            <Text style={text}>L&apos;équipe Tobalgo</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};


VerifyEmail.PreviewProps = {
  verificationLink: `${baseUrl}/verify-email`,
} as VerifyEmailProps;

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
