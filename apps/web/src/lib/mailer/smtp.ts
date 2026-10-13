import "server-only";

import type { SendMailOptions } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Mailer, MailOptions } from "./types";
import { EmailError } from "./types";

export class SmtpMailer implements Mailer {
  constructor(
    private transport: {
      sendMail(
        options: SendMailOptions,
      ): Promise<SMTPTransport.SentMessageInfo>;
    },
  ) {}

  public emails = {
    send: async (options: MailOptions) => {
      if (!options.body || options.templateId) {
        throw new EmailError(
          "SMTP requires a rendered email body and does not support provider templates",
          "MISSING_BODY",
        );
      }
      const result = await this.transport.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.body,
        attachments: options.attachments?.map((attachment) => ({
          filename: attachment.name,
          content: Buffer.from(attachment.content, "base64"),
          contentType: attachment.type,
        })),
      });
      if (result.rejected.length > 0 || result.accepted.length === 0) {
        throw new EmailError("SMTP server rejected the recipient", "REJECTED");
      }
      return {
        success: true,
        message: "Email sent successfully",
        data: { messageId: result.messageId },
      };
    },
  };
}
