import "server-only";

import { PlunkMailer } from "./plunk";
import { Mailer } from "./types";

export function createMailer(): Mailer {
  const provider = "plunk";

  if (provider === "plunk") {
    return new PlunkMailer(process.env.PLUNK_SECRET_KEY!);
  }

  // Add additional providers here as needed

  throw new Error("Unsupported mailer provider");
}
