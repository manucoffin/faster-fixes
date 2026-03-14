import "server-only";

import { PlunkMailer } from "./plunk";
import { ResendMailer } from "./resend";
import { Mailer } from "./types";

type MailerProvider = "plunk" | "resend";

export function createMailer(): Mailer {
  const provider = "resend" as MailerProvider;

  switch (provider) {
    case "plunk":
      return new PlunkMailer(process.env.PLUNK_SECRET_KEY!);
    case "resend":
      return new ResendMailer(process.env.RESEND_API_KEY!);
    default:
      throw new Error(`Unsupported mailer provider: ${provider}`);
  }
}
