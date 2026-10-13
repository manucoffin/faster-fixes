const verifiedDomain = process.env.MAIL_FROM_DOMAIN?.trim();
const mailDomain =
  verifiedDomain === ""
    ? process.env.DOMAIN_NAME
    : (verifiedDomain ?? process.env.DOMAIN_NAME);
const sender = process.env.EMAIL_FROM?.trim();
export const NO_REPLY_EMAIL =
  sender === "" ? `noreply@${mailDomain}` : (sender ?? `noreply@${mailDomain}`);
export const SENDER_EMAIL =
  sender === "" ? `contact@${mailDomain}` : (sender ?? `contact@${mailDomain}`);
