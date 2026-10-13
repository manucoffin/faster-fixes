import "server-only";

import { requireEnv } from "@/utils/environment/require-env";
import { createTransport } from "nodemailer";

import { PlunkMailer } from "./plunk";
import { ResendMailer } from "./resend";
import { SmtpMailer } from "./smtp";
import type { Mailer } from "./types";

export function createMailer(): Mailer {
  const provider = process.env.MAILER_PROVIDER ?? "resend";

  switch (provider) {
    case "smtp": {
      const port = Number(process.env.SMTP_PORT ?? "587");
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("SMTP_PORT must be an integer between 1 and 65535");
      }
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD;
      if (Boolean(user) !== Boolean(pass)) {
        throw new Error(
          "SMTP_USER and SMTP_PASSWORD must be configured together",
        );
      }
      return new SmtpMailer(
        createTransport({
          host: requireEnv("SMTP_HOST", process.env.SMTP_HOST),
          port,
          secure: process.env.SMTP_SECURE === "true" || port === 465,
          requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
          ...(user && pass ? { auth: { user, pass } } : {}),
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 30_000,
        }),
      );
    }
    case "plunk":
      return new PlunkMailer(process.env.PLUNK_SECRET_KEY ?? "");
    case "resend":
      // The Resend SDK already throws without a key: this only names the variable
      return new ResendMailer(
        requireEnv("RESEND_API_KEY", process.env.RESEND_API_KEY),
      );
    default:
      throw new Error(`Unsupported mailer provider: ${String(provider)}`);
  }
}
