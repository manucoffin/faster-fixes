import "server-only";

import { createMailer } from "./mailer-factory";

export const mailer = createMailer();

// Re-export types for convenience
export type {
  Contact,
  CreateContactOptions,
  EmailAttachment,
  EmailResponse,
  Mailer,
  MailOptions,
  UpdateContactOptions,
} from "./types";

export { EmailError } from "./types";
