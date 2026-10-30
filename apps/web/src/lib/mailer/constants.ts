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

// Commercial mail goes out under a person's name so replies reach a read inbox.
// Instances without one (self-hosted) fall back to the transactional sender.
const commercialSender = process.env.COMMERCIAL_EMAIL_FROM?.trim();
export const HAS_COMMERCIAL_SENDER = Boolean(commercialSender);
export const COMMERCIAL_SENDER_EMAIL =
  commercialSender === "" ? SENDER_EMAIL : (commercialSender ?? SENDER_EMAIL);
